"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Upload, X, FileText } from "lucide-react";

export function UploadForm({
  token,
  docLabel,
  caseId,
}: {
  token: string;
  docLabel: string;
  caseId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleUpload() {
    if (!file) return;
    setStatus("uploading");
    setErrorMsg(null);

    try {
      // 1. Get presigned URL from server
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
        }),
      });

      if (!presignRes.ok) {
        const data = await presignRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to get upload URL");
      }

      const { uploadUrl, fileKey, publicUrl } = await presignRes.json();

      // 2. Upload file directly to R2
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      // 3. Notify server that upload is complete
      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fileKey,
          publicUrl,
          filename: file.name,
        }),
      });

      if (!completeRes.ok) throw new Error("Failed to confirm upload");

      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  // ── Success state ────────────────────────────────────────────────────────

  if (status === "done") {
    return (
      <div className="text-center py-2">
        <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Document submitted!
        </h3>
        <p className="text-sm text-gray-500">
          Your{" "}
          <span className="font-medium text-gray-700">{docLabel}</span> has been
          securely sent to your contractor.
        </p>
        <p className="text-xs text-gray-400 mt-3">
          You may close this page. No further action needed.
        </p>
      </div>
    );
  }

  // ── Upload form ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {file ? (
        // File selected state
        <div className="rounded-xl border-2 border-blue-300 bg-blue-50 px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <FileText className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            className="text-xs text-blue-600 hover:text-blue-800 mt-3 font-medium"
          >
            Choose a different file
          </button>
        </div>
      ) : (
        // Empty drop zone
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl py-10 px-6 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Upload className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">
            Tap to select a file
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PDF, JPG, or PNG · Max 10 MB
          </p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setErrorMsg(null);
        }}
      />

      {/* Error */}
      {errorMsg && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Submit */}
      <Button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 text-sm font-semibold"
        disabled={!file || status === "uploading"}
        onClick={handleUpload}
      >
        {status === "uploading" ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Uploading…
          </span>
        ) : (
          "Submit Document"
        )}
      </Button>

      {!file && (
        <p className="text-xs text-center text-gray-400">
          Your file is transmitted securely and delivered directly to your contractor.
        </p>
      )}
    </div>
  );
}
