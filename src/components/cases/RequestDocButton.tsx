"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RequestDocButton({
  caseId,
  docType,
  docLabel,
  homeownerPhone,
  homeownerName,
  alreadySent,
}: {
  caseId: string;
  docType: string;
  docLabel: string;
  homeownerPhone: string;
  homeownerName: string;
  alreadySent: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/cases/${caseId}/request-docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType, docLabel, homeownerPhone, homeownerName }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to send");
        return;
      }

      const data = await res.json();
      // uploadUrl is only present when Twilio is not configured (local dev).
      setUploadUrl(data.uploadUrl ?? null);
      router.refresh();
    });
  }

  async function handleCopy() {
    if (!uploadUrl) return;
    await navigator.clipboard.writeText(uploadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Twilio configured — SMS was sent, show normal sent state.
  const smsSent = !uploadUrl && (alreadySent || isPending === false);

  if (uploadUrl) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 font-mono truncate max-w-[180px]" title={uploadUrl}>
            {uploadUrl.replace(/^https?:\/\/[^/]+/, "")}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="text-xs h-6 px-2 shrink-0"
          >
            {copied ? "Copied!" : "Copy link"}
          </Button>
        </div>
        <span className="text-xs text-yellow-600">SMS not configured — share link manually</span>
      </div>
    );
  }

  if (alreadySent) {
    return <span className="text-xs text-yellow-600">Requested</span>;
  }

  return (
    <div className="text-right">
      <Button
        size="sm"
        variant="outline"
        onClick={handleRequest}
        disabled={isPending}
        className="text-xs h-7"
      >
        {isPending ? "Sending..." : "Request from Homeowner"}
      </Button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
