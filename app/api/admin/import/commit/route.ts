import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectToDatabase from "@/lib/db";
import Person from "@/models/Person";
import { requireAdminSession } from "@/lib/auth";
import { PersonSchema, normalizeStudentId } from "@/lib/validators";

const CommitRequestSchema = z.object({
  rows: z.array(
    z.object({
      studentId: z.string().min(1),
      name: z.string().min(1),
      role: z.enum(["President", "Vice President", "Head", "Member"]),
      team: z.string().optional().default(""),
      bio: z.string().optional().default(""),
      linkedin: z.string().optional().default(""),
      github: z.string().optional().default(""),
      other: z.string().optional().default(""),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const authCheck = await requireAdminSession();
    if (!authCheck.authenticated) {
      return authCheck.response;
    }

    const body = await req.json();
    const parseResult = CommitRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid import payload",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { rows } = parseResult.data;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No valid rows provided for import" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Deduplicate incoming rows by normalized studentId (last occurrence wins if duplicate passed)
    const rowMap = new Map<string, typeof rows[0]>();
    for (const r of rows) {
      const normId = normalizeStudentId(r.studentId);
      rowMap.set(normId, { ...r, studentId: normId });
    }

    const uniqueRows = Array.from(rowMap.values());
    const studentIds = uniqueRows.map((r) => r.studentId);

    // Check which IDs already exist to report inserted vs updated counts accurately
    const existing = await Person.find(
      { studentId: { $in: studentIds } },
      { studentId: 1 }
    ).lean();
    const existingIdSet = new Set(existing.map((p) => p.studentId));

    let insertedCount = 0;
    let updatedCount = 0;

    const bulkOps = uniqueRows.map((row) => {
      const isExisting = existingIdSet.has(row.studentId);
      if (isExisting) {
        updatedCount++;
      } else {
        insertedCount++;
      }

      return {
        updateOne: {
          filter: { studentId: row.studentId },
          update: {
            $set: {
              name: row.name.trim(),
              role: row.role,
              team: (row.team || "").trim(),
              bio: (row.bio || "").trim(),
              socials: {
                linkedin: (row.linkedin || "").trim(),
                github: (row.github || "").trim(),
                other: (row.other || "").trim(),
              },
              active: true,
            },
            $setOnInsert: {
              studentId: row.studentId,
            },
          },
          upsert: true,
        },
      };
    });

    if (bulkOps.length > 0) {
      await Person.bulkWrite(bulkOps, { ordered: false });
    }

    return NextResponse.json({
      success: true,
      totalProcessed: uniqueRows.length,
      insertedCount,
      updatedCount,
      message: `Successfully processed ${uniqueRows.length} members (${insertedCount} new, ${updatedCount} updated).`,
    });
  } catch (err: unknown) {
    console.error("Error committing import:", err);
    return NextResponse.json(
      { error: "Failed to commit import to database. Please check connection and try again." },
      { status: 500 }
    );
  }
}
