"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Send, Copy, Check, X } from "lucide-react";

type UploadUrlInfo = { label: string; url: string };

export function BatchRequestButton({
  caseId,
  docs,
  homeownerPhone,
  homeownerName,
}: {
  caseId: string;
  docs: { docType: string; docLabel: string }[];
  homeownerPhone: string;
  homeownerName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadUrls, setUploadUrls] = useState<UploadUrlInfo[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!docs.length) return null;

  async function handleBatchRequest() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/cases/${caseId}/request-docs/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docs, homeownerPhone, homeownerName }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Failed to send");
        return;
      }

      const data = await res.json();
      // Dev mode: SMS not configured — show copyable links
      setUploadUrls(data.uploadUrls ?? null);
      router.refresh();
    });
  }

  async function handleCopyAll() {
    if (!uploadUrls) return;
    const text = uploadUrls.map((u) => `${u.label}: ${u.url}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // Dev mode result: show links to copy
  if (uploadUrls) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-amber-600">
          SMS not configured — share links manually
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyAll}
          className="text-xs h-7 gap-1 shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy All Links
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-red-600 flex items-center gap-1">
          <X className="w-3 h-3" />
          {error}
        </span>
      )}
      <Button
        size="sm"
        onClick={handleBatchRequest}
        disabled={isPending}
        className="text-xs h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
      >
        {isPending ? (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 border-2 border-blue-300 border-t-white rounded-full animate-spin" />
            Sending…
          </span>
        ) : (
          <>
            <Send className="w-3 h-3" />
            Request All Missing ({docs.length})
          </>
        )}
      </Button>
    </div>
  );
}
