import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import connectToDatabase from "@/lib/db";
import Person from "@/models/Person";
import { requireAdminSession } from "@/lib/auth";
import { normalizeStudentId, RoleEnum } from "@/lib/validators";

interface ParsedRow {
  rowIndex: number;
  studentId: string;
  name: string;
  role: string;
  team: string;
  bio: string;
  linkedin: string;
  github: string;
  other: string;
  status: "valid_new" | "valid_update" | "error";
  errors: string[];
}

function normalizeHeaderKey(key: string): string {
  const clean = key.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (/^studentid|studentid$|regno|rollno|id$/.test(clean)) return "studentId";
  if (/^fullname|name|membername$/.test(clean)) return "name";
  if (/^role|designation|position$/.test(clean)) return "role";
  if (/^team|department|subteam|committee$/.test(clean)) return "team";
  if (/^bio|about|description$/.test(clean)) return "bio";
  if (/^linkedin|linkedinurl|sociallinkedin$/.test(clean)) return "linkedin";
  if (/^github|githuburl|socialgithub$/.test(clean)) return "github";
  if (/^other|website|portfolio|socialother$/.test(clean)) return "other";
  return key;
}

function normalizeRoleValue(val: string): string {
  const trimmed = (val || "").trim();
  const lower = trimmed.toLowerCase();
  if (lower === "president") return "President";
  if (lower === "vice president" || lower === "vp" || lower === "vice-president") return "Vice President";
  if (lower === "head" || lower === "lead" || lower === "team lead") return "Head";
  if (lower === "member" || lower === "general member") return "Member";
  return trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const authCheck = await requireAdminSession();
    if (!authCheck.authenticated) {
      return authCheck.response;
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Please upload a valid Excel or CSV file." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let workbook: XLSX.WorkBook;

    try {
      workbook = XLSX.read(buffer, { type: "buffer" });
    } catch {
      return NextResponse.json(
        { error: "Failed to parse spreadsheet. Ensure the file is a valid .xlsx, .xls, or .csv file." },
        { status: 400 }
      );
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        { error: "The uploaded workbook does not contain any sheets." },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: "",
      raw: false,
    });

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json(
        { error: "The uploaded sheet appears to be empty." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Map each raw row to our internal model
    const normalizedRows: Array<{
      rowIndex: number;
      studentId: string;
      name: string;
      role: string;
      team: string;
      bio: string;
      linkedin: string;
      github: string;
      other: string;
      errors: string[];
    }> = [];

    const seenIdsInSheet = new Set<string>();
    const duplicateIdsInSheet = new Set<string>();

    // First pass: extract and find sheet-level duplicates
    rawRows.forEach((rawRow, idx) => {
      const rowMapped: Record<string, string> = {
        studentId: "",
        name: "",
        role: "Member",
        team: "",
        bio: "",
        linkedin: "",
        github: "",
        other: "",
      };

      for (const [key, val] of Object.entries(rawRow)) {
        const normKey = normalizeHeaderKey(key);
        rowMapped[normKey] = String(val || "").trim();
      }

      const normalizedId = normalizeStudentId(rowMapped.studentId);
      const errors: string[] = [];

      if (!normalizedId) {
        errors.push("Missing student ID");
      } else {
        if (seenIdsInSheet.has(normalizedId)) {
          duplicateIdsInSheet.add(normalizedId);
        } else {
          seenIdsInSheet.add(normalizedId);
        }
      }

      if (!rowMapped.name) {
        errors.push("Missing name");
      }

      const normalizedRole = normalizeRoleValue(rowMapped.role);
      const roleValidation = RoleEnum.safeParse(normalizedRole);
      if (!roleValidation.success) {
        errors.push(
          `Invalid role "${rowMapped.role}". Must be President, Vice President, Head, or Member.`
        );
      }

      normalizedRows.push({
        rowIndex: idx + 2, // 1-based index accounting for header row
        studentId: normalizedId,
        name: rowMapped.name,
        role: roleValidation.success ? roleValidation.data : rowMapped.role,
        team: rowMapped.team || "",
        bio: rowMapped.bio || "",
        linkedin: rowMapped.linkedin || "",
        github: rowMapped.github || "",
        other: rowMapped.other || "",
        errors,
      });
    });

    // Query DB to determine which IDs currently exist
    const validIds = Array.from(seenIdsInSheet);
    const existingPeople = await Person.find(
      { studentId: { $in: validIds } },
      { studentId: 1 }
    ).lean();
    const existingIdSet = new Set(existingPeople.map((p) => p.studentId));

    // Second pass: assign final status and flag duplicate occurrences
    const previewRows: ParsedRow[] = normalizedRows.map((row) => {
      const finalErrors = [...row.errors];

      if (row.studentId && duplicateIdsInSheet.has(row.studentId)) {
        finalErrors.push(`Duplicate student ID "${row.studentId}" appears multiple times in sheet`);
      }

      const hasErrors = finalErrors.length > 0;
      let status: ParsedRow["status"] = "error";

      if (!hasErrors) {
        status = existingIdSet.has(row.studentId) ? "valid_update" : "valid_new";
      }

      return {
        rowIndex: row.rowIndex,
        studentId: row.studentId,
        name: row.name,
        role: row.role,
        team: row.team,
        bio: row.bio,
        linkedin: row.linkedin,
        github: row.github,
        other: row.other,
        status,
        errors: finalErrors,
      };
    });

    const validNewCount = previewRows.filter((r) => r.status === "valid_new").length;
    const validUpdateCount = previewRows.filter((r) => r.status === "valid_update").length;
    const errorCount = previewRows.filter((r) => r.status === "error").length;

    return NextResponse.json({
      success: true,
      totalRows: previewRows.length,
      validCount: validNewCount + validUpdateCount,
      validNewCount,
      validUpdateCount,
      errorCount,
      rows: previewRows,
    });
  } catch (err: unknown) {
    console.error("Error generating import preview:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while parsing the file." },
      { status: 500 }
    );
  }
}
