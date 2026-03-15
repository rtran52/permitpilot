"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Upload } from "lucide-react";

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
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  if (status === "done") {
    return (
      <div className="flex items-center gap-2 text-green-700 text-sm">
        <CheckCircle2 className="w-5 h-5" />
        <span>Document submitted successfully. Thank you!</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-gray-300 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
        {file ? (
          <p className="text-sm text-gray-700 font-medium">{file.name}</p>
        ) : (
          <p className="text-sm text-gray-500">
            Tap to select a file (PDF, JPG, PNG)
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <Button
        className="w-full"
        disabled={!file || status === "uploading"}
        onClick={handleUpload}
      >
        {status === "uploading" ? "Uploading..." : "Submit Document"}
      </Button>
    </div>
  );
}
