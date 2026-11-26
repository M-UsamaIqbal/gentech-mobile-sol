"use client";

import * as React from "react";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface DocumentUploadProps {
  onUpload: (urls: string[]) => void;
  maxFiles?: number;
}

export function DocumentUpload({ onUpload, maxFiles = 5 }: DocumentUploadProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = React.useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid: File[] = [];
    const errors: string[] = [];

    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type (PDF, JPEG, PNG, WebP only)`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 5MB)`);
        continue;
      }
      valid.push(file);
    }

    if (errors.length > 0) {
      setError(errors.join("; "));
    } else {
      setError(null);
    }

    setFiles((prev) => [...prev, ...valid].slice(0, maxFiles));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/seller-verification/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setUploadedUrls((prev) => [...prev, ...data.urls]);
      setFiles([]);
      onUpload(data.urls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Upload Documents</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          multiple
          onChange={handleFileChange}
          className="w-full text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, JPEG, PNG, WebP. Max 5MB per file. Up to {maxFiles} files.
        </p>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between rounded border p-2 text-sm">
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Documents"}
          </button>
        </div>
      )}

      {uploadedUrls.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Uploaded Documents:</p>
          {uploadedUrls.map((url, i) => (
            <p key={i} className="text-xs text-green-500 truncate">
              {url.split("/").pop()}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}