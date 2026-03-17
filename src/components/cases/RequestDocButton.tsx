"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Send, Copy, Check } from "lucide-react";

export function RequestDocButton({
  caseId,
  docType,
  docLabel,
  homeownerPhone,
  homeownerName,
  alreadySent,
  priority = false,
}: {
  caseId: string;
  docType: string;
  docLabel: string;
  homeownerPhone: string;
  homeownerName: string;
  alreadySent: boolean;
  /** When true (required doc), renders as a filled blue button instead of outline */
  priority?: boolean;
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

  // Dev mode: Twilio not configured — show copyable upload link
  if (uploadUrl) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs text-gray-500 font-mono truncate max-w-[160px]"
            title={uploadUrl}
          >
            {uploadUrl.replace(/^https?:\/\/[^/]+/, "")}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="text-xs h-6 px-2 shrink-0 gap-1"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </Button>
        </div>
        <span className="text-xs text-amber-600">SMS not configured — share link manually</span>
      </div>
    );
  }

  // Already requested — show re-send option
  if (alreadySent) {
    return (
      <div className="text-right">
        <Button
          size="sm"
          variant="outline"
          onClick={handleRequest}
          disabled={isPending}
          className="text-xs h-7 gap-1.5 text-amber-700 border-amber-200 hover:bg-amber-50"
        >
          {isPending ? (
            "Sending..."
          ) : (
            <>
              <Send className="w-3 h-3" />
              Re-send
            </>
          )}
        </Button>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    );
  }

  // Default: send request button
  return (
    <div className="text-right">
      <Button
        size="sm"
        onClick={handleRequest}
        disabled={isPending}
        className={
          priority
            ? "text-xs h-7 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            : "text-xs h-7 gap-1.5"
        }
        variant={priority ? "default" : "outline"}
      >
        {isPending ? (
          "Sending..."
        ) : (
          <>
            <Send className="w-3 h-3" />
            Request
          </>
        )}
      </Button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
