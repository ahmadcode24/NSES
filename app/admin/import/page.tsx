"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PreviewRow {
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

interface PreviewResponse {
  success: boolean;
  totalRows: number;
  validCount: number;
  validNewCount: number;
  validUpdateCount: number;
  errorCount: number;
  rows: PreviewRow[];
}

export default function AdminImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleFileChange = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setErrorBanner(null);
    setSuccessToast(null);
    setPreviewData(null);
    setParsing(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/admin/import/preview", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorBanner(data.error || "Failed to parse the uploaded file.");
        setParsing(false);
        return;
      }

      setPreviewData(data);
    } catch {
      setErrorBanner("An error occurred while communicating with the server.");
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleCommit = async () => {
    if (!previewData) return;

    const validRows = previewData.rows
      .filter((r) => r.status === "valid_new" || r.status === "valid_update")
      .map((r) => ({
        studentId: r.studentId,
        name: r.name,
        role: r.role as "President" | "Vice President" | "Head" | "Member",
        team: r.team,
        bio: r.bio,
        linkedin: r.linkedin,
        github: r.github,
        other: r.other,
      }));

    if (validRows.length === 0) {
      setErrorBanner("There are no valid rows to import.");
      return;
    }

    setCommitting(true);
    setErrorBanner(null);

    try {
      const res = await fetch("/api/admin/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorBanner(data.error || "Import failed — no changes were saved.");
        setCommitting(false);
        return;
      }

      setSuccessToast(data.message || "Import committed successfully!");
      setPreviewData(null);
      setFile(null);
    } catch {
      setErrorBanner("A network error occurred while committing import.");
    } finally {
      setCommitting(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreviewData(null);
    setErrorBanner(null);
    setSuccessToast(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-bg border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-sm font-semibold text-accent hover:text-accent-hover flex items-center gap-1"
          >
            ← Admin Dashboard
          </Link>
          <span className="text-border">/</span>
          <h1 className="font-bold text-text-primary text-base">Excel Import</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Success Toast */}
        {successToast && (
          <div
            role="status"
            className="mb-6 p-4 rounded-md bg-success/10 border border-success/30 text-success text-sm font-medium flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{successToast}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={resetAll}
                className="underline hover:text-success/80 text-xs font-semibold"
              >
                Import Another File
              </button>
              <Link
                href="/admin"
                className="px-3 py-1 bg-success text-white text-xs font-semibold rounded-sm hover:opacity-90"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorBanner && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-md bg-error/10 border border-error/30 text-error text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorBanner}</span>
          </div>
        )}

        {/* Step 1: Upload Dropzone */}
        {!previewData && (
          <div className="bg-bg border border-border rounded-md shadow-card p-6 sm:p-8">
            <h2 className="text-xl font-bold text-text-primary mb-2">
              Semester Member Import
            </h2>
            <p className="text-sm text-text-secondary mb-6 max-w-2xl">
              Upload an Excel (.xlsx, .xls) or CSV file containing member details. The system
              will validate each row, normalize student IDs, and allow you to review before
              saving to the database.
            </p>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-accent rounded-md p-10 text-center cursor-pointer transition-colors bg-surface/50 hover:bg-surface"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <svg
                  className="w-10 h-10 text-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                {parsing ? (
                  <p className="text-sm font-medium text-accent">
                    Parsing and validating spreadsheet...
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-text-primary">
                      Drag & drop your Excel file here, or{" "}
                      <span className="text-accent underline">browse</span>
                    </p>
                    <p className="text-xs text-text-secondary">
                      Supports .xlsx, .xls, and .csv (Max ~10MB)
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Expected Column Headers
              </h3>
              <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
                <span className="px-2 py-1 bg-surface border border-border rounded-sm">
                  Student ID <strong className="text-text-primary">(Required)</strong>
                </span>
                <span className="px-2 py-1 bg-surface border border-border rounded-sm">
                  Name <strong className="text-text-primary">(Required)</strong>
                </span>
                <span className="px-2 py-1 bg-surface border border-border rounded-sm">
                  Role <strong className="text-text-primary">(President, VP, Head, Member)</strong>
                </span>
                <span className="px-2 py-1 bg-surface border border-border rounded-sm">
                  Team (Optional)
                </span>
                <span className="px-2 py-1 bg-surface border border-border rounded-sm">
                  Bio (Optional)
                </span>
                <span className="px-2 py-1 bg-surface border border-border rounded-sm">
                  LinkedIn (Optional)
                </span>
                <span className="px-2 py-1 bg-surface border border-border rounded-sm">
                  GitHub (Optional)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview & Validation Table */}
        {previewData && (
          <div className="space-y-6">
            {/* Summary Statistics Banner */}
            <div className="bg-bg border border-border rounded-md shadow-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  Import Preview: {file?.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm">
                  <span className="text-text-secondary">
                    Total: <strong>{previewData.totalRows}</strong> rows
                  </span>
                  <span className="text-success flex items-center gap-1 font-medium">
                    ● {previewData.validNewCount} new
                  </span>
                  <span className="text-accent flex items-center gap-1 font-medium">
                    ● {previewData.validUpdateCount} updates
                  </span>
                  {previewData.errorCount > 0 && (
                    <span className="text-error flex items-center gap-1 font-medium">
                      ● {previewData.errorCount} flagged errors
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetAll}
                  disabled={committing}
                  className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface hover:bg-border/60 rounded-sm border border-border transition-colors disabled:opacity-50"
                >
                  Cancel / Re-upload
                </button>
                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={committing || previewData.validCount === 0}
                  className="px-5 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-sm shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                >
                  {committing ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Committing Import...
                    </>
                  ) : (
                    `Confirm Import (${previewData.validCount} Valid Rows)`
                  )}
                </button>
              </div>
            </div>

            {/* Preview Table */}
            <div className="bg-bg border border-border rounded-md shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface border-b border-border text-xs text-text-secondary uppercase">
                    <tr>
                      <th className="px-4 py-3">Row</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Student ID</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Team</th>
                      <th className="px-4 py-3">Notes / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {previewData.rows.map((row) => (
                      <tr
                        key={`${row.rowIndex}-${row.studentId}`}
                        className={
                          row.status === "error"
                            ? "bg-error/5 hover:bg-error/10"
                            : row.status === "valid_update"
                            ? "bg-accent/5 hover:bg-accent/10"
                            : "hover:bg-surface/60"
                        }
                      >
                        <td className="px-4 py-3 text-xs text-text-secondary font-mono">
                          #{row.rowIndex}
                        </td>
                        <td className="px-4 py-3">
                          {row.status === "valid_new" && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
                              ✅ New
                            </span>
                          )}
                          {row.status === "valid_update" && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                              🔄 Update
                            </span>
                          )}
                          {row.status === "error" && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-error/10 text-error">
                              ⚠️ Error
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-text-primary">
                          {row.studentId || <span className="text-error italic">Empty</span>}
                        </td>
                        <td className="px-4 py-3 text-text-primary font-medium">
                          {row.name || <span className="text-error italic">Empty</span>}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {row.role}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {row.team || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {row.errors.length > 0 ? (
                            <ul className="text-error list-disc list-inside space-y-0.5">
                              {row.errors.map((err, i) => (
                                <li key={i}>{err}</li>
                              ))}
                            </ul>
                          ) : row.status === "valid_update" ? (
                            <span className="text-accent">
                              Matches existing profile; details will be updated in place.
                            </span>
                          ) : (
                            <span className="text-success">
                              Ready to create new profile.
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
