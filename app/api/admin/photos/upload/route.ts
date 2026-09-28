import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Person from "@/models/Person";
import { requireAdminSession } from "@/lib/auth";
import { uploadImageBuffer } from "@/lib/cloudinary";
import { normalizeStudentId } from "@/lib/validators";

export interface PhotoUploadResult {
  filename: string;
  studentId: string;
  status: "success" | "skipped" | "error";
  message: string;
  matchedName?: string;
  photoUrl?: string;
}

export async function POST(req: NextRequest) {
  try {
    const authCheck = await requireAdminSession();
    if (!authCheck.authenticated) {
      return authCheck.response;
    }

    const formData = await req.formData();
    const files = formData.getAll("photos") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No photo files provided. Please select at least one image." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const results: PhotoUploadResult[] = [];
    let uploadedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const file of files) {
      const originalFilename = file.name;
      // Strip extension to extract the Student ID
      const baseFilename = originalFilename.substring(
        0,
        originalFilename.lastIndexOf(".") > 0
          ? originalFilename.lastIndexOf(".")
          : originalFilename.length
      );
      const studentId = normalizeStudentId(baseFilename);

      if (!studentId) {
        results.push({
          filename: originalFilename,
          studentId: "",
          status: "skipped",
          message: "Filename does not contain a valid Student ID",
        });
        skippedCount++;
        continue;
      }

      // Check if person with this student ID exists in database
      const person = await Person.findOne({ studentId });

      if (!person) {
        results.push({
          filename: originalFilename,
          studentId,
          status: "skipped",
          message: `No matching member found with Student ID "${studentId}"`,
        });
        skippedCount++;
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Cloudinary with folder and public_id as studentId
        const uploadResponse = await uploadImageBuffer(
          buffer,
          "nses_members",
          studentId
        );

        // Update person record with new Cloudinary photoUrl
        person.photoUrl = uploadResponse.secure_url;
        await person.save();

        results.push({
          filename: originalFilename,
          studentId,
          status: "success",
          message: `Successfully matched and uploaded for ${person.name}`,
          matchedName: person.name,
          photoUrl: uploadResponse.secure_url,
        });
        uploadedCount++;
      } catch (uploadErr: unknown) {
        console.error(`Error uploading photo for ${studentId}:`, uploadErr);
        results.push({
          filename: originalFilename,
          studentId,
          status: "error",
          message: `Cloudinary upload failed for ${person.name} (${(uploadErr as Error)?.message || "Unknown error"})`,
          matchedName: person.name,
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      totalFiles: files.length,
      uploadedCount,
      skippedCount,
      errorCount,
      results,
    });
  } catch (err: unknown) {
    console.error("Bulk photo upload error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during bulk photo upload." },
      { status: 500 }
    );
  }
}
