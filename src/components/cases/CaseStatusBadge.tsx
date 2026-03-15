import { Badge } from "@/components/ui/badge";
import { CaseStatus } from "@prisma/client";

const STATUS_CONFIG: Record<
  CaseStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  NEW: { label: "New", variant: "secondary" },
  DOCS_REQUESTED: { label: "Docs Requested", variant: "outline" },
  DOCS_COMPLETE: { label: "Docs Complete", variant: "outline" },
  SUBMITTED: { label: "Submitted", variant: "default" },
  CORRECTIONS_REQUIRED: { label: "Corrections Required", variant: "destructive" },
  RESUBMITTED: { label: "Resubmitted", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  READY_TO_START: { label: "Ready to Start", variant: "default" },
  ON_HOLD: { label: "On Hold", variant: "secondary" },
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const { label, variant } = STATUS_CONFIG[status];
  return <Badge variant={variant}>{label}</Badge>;
}
