"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, X, FileText } from "lucide-react";

export function OfficeUploadButton({
  caseId,
  docType,
  docLabel,
}: {
  caseId: string;
  docType: string;
  docLabel: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setError(null);
    setDone(false);
    // Auto-upload on file selection
    if (selected) upload(selected);
  }

  function upload(fileToUpload: File) {
    startTransition(async () => {
      try {
        // 1. Get presigned URL
        const presignRes = await fetch(`/api/cases/${caseId}/upload/presign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: fileToUpload.name,
            contentType: fileToUpload.type || "application/octet-stream",
            docType,
          }),
        });
        if (!presignRes.ok) {
          const d = await presignRes.json().catch(() => ({}));
          throw new Error(d.error ?? "Failed to get upload URL");
        }
        const { uploadUrl, fileKey, publicUrl } = await presignRes.json();

        // 2. Upload directly to R2
        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          body: fileToUpload,
          headers: {
            "Content-Type": fileToUpload.type || "application/octet-stream",
          },
        });
        if (!putRes.ok) throw new Error("Upload to storage failed");

        // 3. Record the document
        const completeRes = await fetch(
          `/api/cases/${caseId}/upload/complete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileKey,
              publicUrl,
              docType,
              docLabel,
            }),
          }
        );
        if (!completeRes.ok) throw new Error("Failed to record upload");

        setDone(true);
        setFile(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setFile(null);
      }
    });
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Uploaded
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChange}
      />

      {isPending ? (
        <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium">
          <span className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          {file ? (
            <span className="truncate max-w-[100px]" title={file.name}>
              <FileText className="w-3 h-3 inline mr-0.5" />
              {file.name.length > 14
                ? file.name.slice(0, 12) + "…"
                : file.name}
            </span>
          ) : (
            "Uploading…"
          )}
        </span>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7 gap-1.5"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
        >
          <Upload className="w-3 h-3" />
          Upload
        </Button>
      )}

      {error && (
        <span className="text-xs text-red-500 flex items-center gap-1">
          <X className="w-3 h-3" />
          {error}
        </span>
      )}
    </div>
  );
}
