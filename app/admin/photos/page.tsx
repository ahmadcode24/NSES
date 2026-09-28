"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

interface UploadResultItem {
  filename: string;
  studentId: string;
  status: "success" | "skipped" | "error";
  message: string;
  matchedName?: string;
  photoUrl?: string;
}

interface UploadResponse {
  success: boolean;
  totalFiles: number;
  uploadedCount: number;
  skippedCount: number;
  errorCount: number;
  results: UploadResultItem[];
}

export default function AdminPhotosPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const handleFiles = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const array = Array.from(filesList);
    setSelectedFiles(array);
    setUploadData(null);
    setErrorBanner(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setErrorBanner(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("photos", file);
    });

    try {
      const res = await fetch("/api/admin/photos/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorBanner(data.error || "Failed to upload photos to Cloudinary.");
        setUploading(false);
        return;
      }

      setUploadData(data);
    } catch {
      setErrorBanner("A network error occurred while uploading photos.");
    } finally {
      setUploading(false);
    }
  };

  const resetAll = () => {
    setSelectedFiles([]);
    setUploadData(null);
    setErrorBanner(null);
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
          <h1 className="font-bold text-text-primary text-base">Bulk Photo Upload</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
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

        {/* Upload Container */}
        {!uploadData && (
          <div className="bg-bg border border-border rounded-md shadow-card p-6 sm:p-8">
            <h2 className="text-xl font-bold text-text-primary mb-2">
              Match & Upload Member Photos
            </h2>
            <p className="text-sm text-text-secondary mb-6 max-w-2xl">
              Select or drop multiple image files. Name each image file with the member&apos;s
              Student ID (e.g., <code className="bg-surface px-1.5 py-0.5 rounded text-accent font-mono text-xs">2022-SE-045.jpg</code>).
              The system matches each file to their profile, uploads it to Cloudinary, and updates their profile automatically.
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
                multiple
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm font-medium text-text-primary">
                  Drag & drop multiple member photos, or{" "}
                  <span className="text-accent underline">browse</span>
                </p>
                <p className="text-xs text-text-secondary">
                  PNG, JPG, JPEG, WEBP files
                </p>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-surface rounded-md border border-border">
                <div>
                  <span className="font-semibold text-text-primary text-sm">
                    {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected
                  </span>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Ready to match and push to Cloudinary
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetAll}
                    disabled={uploading}
                    className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary"
                  >
                    Clear Selection
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-sm transition-colors flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Uploading to Cloudinary...
                      </>
                    ) : (
                      `Upload ${selectedFiles.length} Photo${selectedFiles.length > 1 ? "s" : ""}`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Results Screen */}
        {uploadData && (
          <div className="space-y-6">
            <div className="bg-bg border border-border rounded-md shadow-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  Photo Upload Results
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm">
                  <span className="text-text-secondary">
                    Total: <strong>{uploadData.totalFiles}</strong> files
                  </span>
                  <span className="text-success font-medium flex items-center gap-1">
                    ● {uploadData.uploadedCount} uploaded & matched
                  </span>
                  {uploadData.skippedCount > 0 && (
                    <span className="text-warning font-medium flex items-center gap-1">
                      ● {uploadData.skippedCount} skipped (no matching ID)
                    </span>
                  )}
                  {uploadData.errorCount > 0 && (
                    <span className="text-error font-medium flex items-center gap-1">
                      ● {uploadData.errorCount} failed
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface hover:bg-border/60 rounded-sm border border-border transition-colors"
                >
                  Upload More Photos
                </button>
                <Link
                  href="/admin"
                  className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-sm transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-bg border border-border rounded-md shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface border-b border-border text-xs text-text-secondary uppercase">
                    <tr>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Photo</th>
                      <th className="px-4 py-3">Filename</th>
                      <th className="px-4 py-3">Student ID</th>
                      <th className="px-4 py-3">Matched Member</th>
                      <th className="px-4 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {uploadData.results.map((item, idx) => (
                      <tr
                        key={idx}
                        className={
                          item.status === "error"
                            ? "bg-error/5"
                            : item.status === "skipped"
                            ? "bg-warning/5"
                            : "hover:bg-surface/50"
                        }
                      >
                        <td className="px-4 py-3">
                          {item.status === "success" && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
                              ✅ Matched
                            </span>
                          )}
                          {item.status === "skipped" && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                              ⚠️ Skipped
                            </span>
                          )}
                          {item.status === "error" && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-error/10 text-error">
                              ❌ Failed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {item.photoUrl ? (
                            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-border">
                              <Image
                                src={item.photoUrl}
                                alt={item.matchedName ? `Photo of ${item.matchedName}` : "Uploaded photo"}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-text-secondary text-xs">
                              —
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-text-primary">
                          {item.filename}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-text-primary">
                          {item.studentId || "—"}
                        </td>
                        <td className="px-4 py-3 font-medium text-text-primary">
                          {item.matchedName || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-text-secondary">
                          {item.message}
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
