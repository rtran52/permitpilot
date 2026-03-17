"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CaseStatus } from "@/lib/case-status";
import { ArrowRight, AlertCircle } from "lucide-react";

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

const HOLD_REASONS = [
  "Homeowner unresponsive",
  "HOA approval pending",
  "Title or insurance issue",
  "Job paused by homeowner",
  "Waiting on additional documents",
  "Other",
];

export function StatusTransitionForm({
  caseId,
  nextStatuses,
  currentStatus,
  docProgress,
  holdFromStatus,
}: {
  caseId: string;
  nextStatuses: CaseStatus[];
  currentStatus?: CaseStatus;
  docProgress?: { uploaded: number; required: number };
  holdFromStatus?: CaseStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<CaseStatus | null>(null);
  const [note, setNote] = useState("");
  const [permitNumber, setPermitNumber] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSelect(s: CaseStatus) {
    if (s === selected) {
      setSelected(null);
      setNote("");
      setPermitNumber("");
      setHoldReason("");
      setError(null);
    } else {
      setSelected(s);
      setNote("");
      setPermitNumber("");
      setHoldReason("");
      setError(null);
    }
  }

  function canSubmit() {
    if (!selected) return false;
    if (selected === CaseStatus.ON_HOLD && !holdReason) return false;
    return true;
  }

  async function handleSubmit() {
    if (!selected || !canSubmit()) return;
    setError(null);

    const finalNote =
      selected === CaseStatus.ON_HOLD
        ? holdReason + (note ? ` — ${note}` : "")
        : note || undefined;

    startTransition(async () => {
      const res = await fetch(`/api/cases/${caseId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toStatus: selected,
          note: finalNote,
          ...(selected === CaseStatus.SUBMITTED &&
            permitNumber && { permitNumber }),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong");
        return;
      }

      router.refresh();
      setSelected(null);
      setNote("");
      setPermitNumber("");
      setHoldReason("");
    });
  }

  return (
    <div className="space-y-2.5">
      {currentStatus === CaseStatus.ON_HOLD && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Restore this case to the status it was in before the hold was placed
          {holdFromStatus ? ` (${STATUS_LABELS[holdFromStatus]})` : ""}.
        </p>
      )}
      <div className="space-y-1.5">
        {nextStatuses.map((s) => (
          <button
            key={s}
            onClick={() => handleSelect(s)}
            className={`w-full text-left text-sm px-3.5 py-2.5 rounded-lg border transition-all ${
              selected === s
                ? s === CaseStatus.ON_HOLD
                  ? "border-amber-400 bg-amber-50 text-amber-800 font-medium shadow-sm"
                  : "border-blue-500 bg-blue-50 text-blue-700 font-medium shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {selected && (
        <div className="space-y-2.5 pt-1">
          {/* ── DOCS_COMPLETE: warn if docs are missing ── */}
          {selected === CaseStatus.DOCS_COMPLETE && docProgress && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Only {docProgress.uploaded} of {docProgress.required} required
                documents are received. Verify all documents are in hand before
                marking complete.
              </span>
            </div>
          )}

          {/* ── SUBMITTED: permit number field ── */}
          {selected === CaseStatus.SUBMITTED && (
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Permit / Reference # <span className="text-gray-400">(optional)</span>
              </label>
              <Input
                value={permitNumber}
                onChange={(e) => setPermitNumber(e.target.value)}
                placeholder="e.g. BLD-2024-04521"
                className="h-8 text-sm font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">
                Add the tracking number from the permit office if available.
              </p>
            </div>
          )}

          {/* ── ON_HOLD: required reason ── */}
          {selected === CaseStatus.ON_HOLD && (
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Hold reason <span className="text-red-500">*</span>
              </label>
              <select
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              >
                <option value="">Select a reason…</option>
                {HOLD_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── READY_TO_START: confirmation reminder ── */}
          {selected === CaseStatus.READY_TO_START && (
            <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-xs text-emerald-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Only advance when the permit is physically in hand and your
                scheduling team has been notified.
              </span>
            </div>
          )}

          {/* Optional free-text note (shown for all statuses) */}
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              selected === CaseStatus.ON_HOLD
                ? "Additional details (optional)…"
                : "Optional note…"
            }
            className="text-sm resize-none bg-white border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
            rows={2}
          />

          <Button
            size="sm"
            className={`w-full gap-2 text-white ${
              selected === CaseStatus.ON_HOLD
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            onClick={handleSubmit}
            disabled={isPending || !canSubmit()}
          >
            {isPending ? (
              "Updating..."
            ) : (
              <>
                Move to {STATUS_LABELS[selected]}
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
