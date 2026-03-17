import { CaseStatus } from "@/lib/case-status";
import { cn } from "@/lib/utils";

// Dot + pill badge system. Each status has a distinct color family so
// the table and detail pages read at a glance without reading the text.
const STATUS_CONFIG: Record<
  CaseStatus,
  { label: string; dot: string; className: string }
> = {
  NEW: {
    label: "New",
    dot: "bg-slate-400",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  DOCS_REQUESTED: {
    label: "Docs Requested",
    dot: "bg-blue-500",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  DOCS_COMPLETE: {
    label: "Docs Complete",
    dot: "bg-cyan-500",
    className: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  SUBMITTED: {
    label: "Submitted",
    dot: "bg-violet-500",
    className: "bg-violet-50 text-violet-700 border-violet-200",
  },
  CORRECTIONS_REQUIRED: {
    label: "Corrections Required",
    dot: "bg-red-500",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  RESUBMITTED: {
    label: "Resubmitted",
    dot: "bg-purple-500",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  APPROVED: {
    label: "Approved",
    dot: "bg-emerald-500",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  READY_TO_START: {
    label: "Ready to Start",
    dot: "bg-white opacity-80",
    className: "bg-emerald-600 text-white border-emerald-600 font-semibold",
  },
  ON_HOLD: {
    label: "On Hold",
    dot: "bg-orange-400",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const { label, dot, className } = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />
      {label}
    </span>
  );
}

// Human-readable label only — used in status history log and transition form.
export function statusLabel(status: CaseStatus): string {
  return STATUS_CONFIG[status].label;
}
