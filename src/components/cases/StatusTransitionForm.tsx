"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CaseStatus } from "@prisma/client";

const STATUS_LABELS: Record<CaseStatus, string> = {
  NEW: "New",
  DOCS_REQUESTED: "Docs Requested",
  DOCS_COMPLETE: "Docs Complete",
  SUBMITTED: "Submitted",
  CORRECTIONS_REQUIRED: "Corrections Required",
  RESUBMITTED: "Resubmitted",
  APPROVED: "Approved",
  READY_TO_START: "Ready to Start",
  ON_HOLD: "On Hold",
};

export function StatusTransitionForm({
  caseId,
  nextStatuses,
}: {
  caseId: string;
  nextStatuses: CaseStatus[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<CaseStatus | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!selected) return;
    setError(null);

    startTransition(async () => {
      const res = await fetch(`/api/cases/${caseId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus: selected, note: note || undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong");
        return;
      }

      router.refresh();
      setSelected(null);
      setNote("");
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {nextStatuses.map((s) => (
          <button
            key={s}
            onClick={() => setSelected(s === selected ? null : s)}
            className={`w-full text-left text-sm px-3 py-2 rounded-md border transition-colors ${
              selected === s
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300 text-gray-700"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {selected && (
        <>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note..."
            className="text-sm"
            rows={2}
          />
          <Button
            size="sm"
            className="w-full"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? "Updating..." : `Move to ${STATUS_LABELS[selected]}`}
          </Button>
        </>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
