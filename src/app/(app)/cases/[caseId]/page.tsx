import { requireUser } from "@/lib/auth";
import { getCaseWithDetails } from "@/lib/cases";
import { notFound } from "next/navigation";
import { CaseStatusBadge, statusLabel } from "@/components/cases/CaseStatusBadge";
import { StatusTransitionForm } from "@/components/cases/StatusTransitionForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CaseStatus } from "@prisma/client";
import {
  FileText,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  Hash,
  ExternalLink,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Flag,
} from "lucide-react";

// ── Status transition map ─────────────────────────────────────────────────────

const NEXT_STATUSES: Partial<Record<CaseStatus, CaseStatus[]>> = {
  NEW: [CaseStatus.DOCS_REQUESTED, CaseStatus.DOCS_COMPLETE, CaseStatus.ON_HOLD],
  DOCS_REQUESTED: [CaseStatus.DOCS_COMPLETE, CaseStatus.ON_HOLD],
  DOCS_COMPLETE: [CaseStatus.SUBMITTED, CaseStatus.ON_HOLD],
  SUBMITTED: [CaseStatus.CORRECTIONS_REQUIRED, CaseStatus.APPROVED, CaseStatus.ON_HOLD],
  CORRECTIONS_REQUIRED: [CaseStatus.RESUBMITTED, CaseStatus.ON_HOLD],
  RESUBMITTED: [CaseStatus.CORRECTIONS_REQUIRED, CaseStatus.APPROVED, CaseStatus.ON_HOLD],
  APPROVED: [CaseStatus.READY_TO_START],
  ON_HOLD: [CaseStatus.NEW, CaseStatus.DOCS_REQUESTED, CaseStatus.DOCS_COMPLETE, CaseStatus.SUBMITTED],
};

// ── Next-action guidance ──────────────────────────────────────────────────────

type ActionVariant = "info" | "neutral" | "success" | "urgent" | "warn" | "done";

const NEXT_ACTION_CONFIG: Record<
  CaseStatus,
  { heading: string; body: string; linkLabel?: string; linkType?: "documents" | "corrections"; variant: ActionVariant }
> = {
  NEW: {
    heading: "Request required documents from the homeowner",
    body: "Open the Documents tab to see what's needed for this jurisdiction, then send a request by SMS.",
    linkLabel: "Go to Documents",
    linkType: "documents",
    variant: "info",
  },
  DOCS_REQUESTED: {
    heading: "Waiting for homeowner to upload documents",
    body: "Document request has been sent. Follow up by phone if there's no response within 24–48 hours.",
    linkLabel: "Track Documents",
    linkType: "documents",
    variant: "neutral",
  },
  DOCS_COMPLETE: {
    heading: "All documents received — ready to submit",
    body: "Review the documents, then submit the application to the permit office and advance the status to Submitted.",
    linkLabel: "Review Documents",
    linkType: "documents",
    variant: "success",
  },
  SUBMITTED: {
    heading: "Application submitted — awaiting permit office",
    body: "No action needed right now. Update the status when you receive a decision. Typical turnaround is 3–10 business days.",
    variant: "neutral",
  },
  CORRECTIONS_REQUIRED: {
    heading: "Permit office returned corrections — act now",
    body: "Review the open corrections below, resolve each item with the homeowner or as needed, then resubmit the application.",
    linkLabel: "Manage Corrections",
    linkType: "corrections",
    variant: "urgent",
  },
  RESUBMITTED: {
    heading: "Corrections resolved and resubmitted",
    body: "The updated application is back with the permit office. Monitor for a final decision.",
    variant: "neutral",
  },
  APPROVED: {
    heading: "Permit approved — mark as Ready to Start",
    body: "The permit has been issued. Update the status to Ready to Start and coordinate with your scheduling team.",
    variant: "success",
  },
  READY_TO_START: {
    heading: "Job cleared to begin",
    body: "This permit case is complete. The crew can be scheduled. No further action required in PermitPilot.",
    variant: "done",
  },
  ON_HOLD: {
    heading: "Case on hold — identify and resolve the blocker",
    body: "Determine what's preventing progress, resolve it, then restore the case to the appropriate status.",
    variant: "warn",
  },
};

const ACTION_VARIANT_STYLES: Record<
  ActionVariant,
  { card: string; label: string; heading: string; body: string; link: string; iconBg: string }
> = {
  info: {
    card: "border border-blue-200 bg-blue-50/60",
    label: "text-blue-500",
    heading: "text-blue-900",
    body: "text-blue-700/90",
    link: "text-blue-700 hover:text-blue-900",
    iconBg: "bg-blue-100 text-blue-600",
  },
  neutral: {
    card: "border border-gray-200 bg-gray-50",
    label: "text-gray-500",
    heading: "text-gray-800",
    body: "text-gray-600",
    link: "text-gray-700 hover:text-gray-900",
    iconBg: "bg-gray-100 text-gray-500",
  },
  success: {
    card: "border border-emerald-200 bg-emerald-50/60",
    label: "text-emerald-600",
    heading: "text-emerald-900",
    body: "text-emerald-700/90",
    link: "text-emerald-700 hover:text-emerald-900",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  urgent: {
    card: "border border-red-200 bg-red-50/60",
    label: "text-red-600",
    heading: "text-red-900",
    body: "text-red-700/90",
    link: "text-red-700 hover:text-red-900",
    iconBg: "bg-red-100 text-red-600",
  },
  warn: {
    card: "border border-amber-200 bg-amber-50/60",
    label: "text-amber-600",
    heading: "text-amber-900",
    body: "text-amber-700/90",
    link: "text-amber-700 hover:text-amber-900",
    iconBg: "bg-amber-100 text-amber-600",
  },
  done: {
    card: "border border-emerald-100 bg-emerald-50/40",
    label: "text-emerald-500",
    heading: "text-emerald-800",
    body: "text-emerald-600",
    link: "text-emerald-700 hover:text-emerald-900",
    iconBg: "bg-emerald-50 text-emerald-500",
  },
};

const ACTION_VARIANT_ICONS: Record<ActionVariant, React.ElementType> = {
  info: Lightbulb,
  neutral: Clock,
  success: CheckCircle2,
  urgent: AlertTriangle,
  warn: AlertCircle,
  done: Flag,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const user = await requireUser();
  const permitCase = await getCaseWithDetails(caseId, user.companyId);

  if (!permitCase) notFound();

  const nextStatuses = NEXT_STATUSES[permitCase.status] ?? [];
  const unresolvedCorrections = permitCase.corrections.filter((c) => !c.resolved);
  const days = daysSince(permitCase.updatedAt);

  // Doc progress
  const requirements = permitCase.jurisdiction.requirements;
  const uploadedDocTypes = new Set(permitCase.documents.map((d) => d.docType));
  const requiredCount = requirements.filter((r) => r.required).length;
  const uploadedRequiredCount = requirements.filter(
    (r) => r.required && uploadedDocTypes.has(r.docType)
  ).length;
  const allDocsReady = requiredCount > 0 && uploadedRequiredCount === requiredCount;

  return (
    <div className="space-y-5">
      {/* Back link */}
      <div>
        <Link
          href="/cases"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All Cases
        </Link>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight truncate">
            {permitCase.address}
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <p className="text-sm text-gray-500">
              {permitCase.city}, {permitCase.state} {permitCase.zip}
              <span className="mx-1.5 text-gray-300">·</span>
              {permitCase.jurisdiction.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <CaseStatusBadge status={permitCase.status} />
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              days >= 7
                ? "bg-red-100 text-red-600"
                : days >= 3
                ? "bg-amber-50 text-amber-600"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <Clock className="w-3 h-3" />
            {days}d
          </span>
        </div>
      </div>

      {/* Case quick-stats strip */}
      <div className="flex items-center gap-5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-gray-400" />
          <span
            className={`text-xs font-medium ${
              allDocsReady ? "text-emerald-600" : "text-gray-500"
            }`}
          >
            {uploadedRequiredCount}/{requiredCount} docs received
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
          <span
            className={`text-xs font-medium ${
              unresolvedCorrections.length > 0
                ? "text-red-600"
                : "text-gray-400"
            }`}
          >
            {unresolvedCorrections.length > 0
              ? `${unresolvedCorrections.length} open correction${
                  unresolvedCorrections.length !== 1 ? "s" : ""
                }`
              : "No open corrections"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs">
            Created{" "}
            {permitCase.createdAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Recommended action — contextual guidance based on current status */}
      <NextActionGuide status={permitCase.status} caseId={caseId} />

      {/* Open corrections banner — only when there are items to resolve */}
      {unresolvedCorrections.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {unresolvedCorrections.length} open correction
                  {unresolvedCorrections.length > 1 ? "s" : ""} require attention
                </p>
                <ul className="mt-2 space-y-1">
                  {unresolvedCorrections.map((c) => (
                    <li
                      key={c.id}
                      className="text-sm text-red-700 leading-snug flex items-start gap-1.5"
                    >
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                      {c.content}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="shrink-0 border-red-300 text-red-700 hover:bg-red-100 bg-white"
            >
              <Link href={`/cases/${caseId}/corrections`}>Manage →</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-5">
        {/* Left col: homeowner info + history */}
        <div className="col-span-2 space-y-5">
          {/* Homeowner card */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Homeowner
              </h2>
            </div>
            <div className="px-5 py-4">
              <p className="text-base font-semibold text-gray-900 mb-3">
                {permitCase.homeownerName}
              </p>
              <div className="space-y-2">
                <a
                  href={`tel:${permitCase.homeownerPhone}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors group"
                >
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0 group-hover:text-gray-600" />
                  {formatPhone(permitCase.homeownerPhone)}
                </a>
                {permitCase.homeownerEmail && (
                  <a
                    href={`mailto:${permitCase.homeownerEmail}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors group"
                  >
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0 group-hover:text-gray-600" />
                    {permitCase.homeownerEmail}
                  </a>
                )}
              </div>
              {(permitCase.permitNumber || permitCase.externalRef) && (
                <div className="flex gap-6 pt-3 mt-3 border-t border-gray-100">
                  {permitCase.permitNumber && (
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Permit #
                      </p>
                      <p className="text-sm font-mono text-gray-700 mt-0.5">
                        {permitCase.permitNumber}
                      </p>
                    </div>
                  )}
                  {permitCase.externalRef && (
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        CRM Job #
                      </p>
                      <p className="text-sm text-gray-700 mt-0.5">
                        {permitCase.externalRef}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status history */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Activity History
              </h2>
              <span className="text-xs text-gray-400">
                {permitCase.statusHistory.length} event
                {permitCase.statusHistory.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="px-5 py-4">
              {permitCase.statusHistory.length === 0 ? (
                <p className="text-sm text-gray-400">No history yet.</p>
              ) : (
                <ol className="relative border-l border-gray-100 ml-1.5 space-y-0">
                  {permitCase.statusHistory.map((h, i) => (
                    <li key={h.id} className="pl-5 pb-4 last:pb-0 relative">
                      <span
                        className={`absolute -left-[7px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center ${
                          i === 0 ? "bg-blue-500" : "bg-gray-200"
                        }`}
                      />
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-gray-400 tabular-nums shrink-0 w-[76px] mt-0.5">
                          {h.createdAt.toLocaleDateString()}
                        </span>
                        <span
                          className={`text-sm leading-snug ${
                            i === 0
                              ? "text-gray-900 font-semibold"
                              : "text-gray-500"
                          }`}
                        >
                          {h.fromStatus
                            ? `${statusLabel(h.fromStatus)} → ${statusLabel(h.toStatus)}`
                            : statusLabel(h.toStatus)}
                          {h.note && (
                            <span className="text-gray-400 font-normal">
                              {" "}
                              · {h.note}
                            </span>
                          )}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>

        {/* Right col: actions panel */}
        <div className="space-y-4">
          {/* Status transition — primary action, shown first */}
          {nextStatuses.length > 0 && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 shadow-sm">
              <div className="px-4 py-3.5 border-b border-blue-100">
                <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                  Advance Status
                </h2>
                <p className="text-xs text-blue-400 mt-0.5">
                  Move this case to the next stage
                </p>
              </div>
              <div className="p-4">
                <StatusTransitionForm caseId={caseId} nextStatuses={nextStatuses} />
              </div>
            </div>
          )}

          {/* Document & corrections quick-links */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-4 py-3.5 border-b border-gray-100">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Case Sections
              </h2>
            </div>
            <div className="p-3 space-y-1.5">
              <Link
                href={`/cases/${caseId}/documents`}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors group"
              >
                <span className="flex items-center gap-2.5 text-sm text-gray-700 group-hover:text-gray-900">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Documents
                </span>
                <span
                  className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                    allDocsReady
                      ? "bg-emerald-100 text-emerald-700"
                      : uploadedRequiredCount > 0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {uploadedRequiredCount}/{requiredCount}
                </span>
              </Link>

              <Link
                href={`/cases/${caseId}/corrections`}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors group"
              >
                <span className="flex items-center gap-2.5 text-sm text-gray-700 group-hover:text-gray-900">
                  <AlertTriangle className="w-4 h-4 text-gray-400" />
                  Corrections
                </span>
                {unresolvedCorrections.length > 0 ? (
                  <span className="text-xs font-semibold rounded-full bg-red-100 text-red-700 px-2 py-0.5">
                    {unresolvedCorrections.length} open
                  </span>
                ) : (
                  <span className="text-xs text-gray-300">None</span>
                )}
              </Link>
            </div>
          </div>

          {/* Case metadata */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Hash className="w-3 h-3 shrink-0" />
              <span className="font-mono truncate text-gray-400">{caseId.slice(0, 16)}…</span>
              <Link href={`/cases/${caseId}`} className="ml-auto text-gray-400 hover:text-gray-600">
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3 h-3 shrink-0" />
              Created{" "}
              {new Date(permitCase.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function NextActionGuide({
  status,
  caseId,
}: {
  status: CaseStatus;
  caseId: string;
}) {
  const config = NEXT_ACTION_CONFIG[status];
  const styles = ACTION_VARIANT_STYLES[config.variant];
  const Icon = ACTION_VARIANT_ICONS[config.variant];

  const linkHref =
    config.linkType === "documents"
      ? `/cases/${caseId}/documents`
      : config.linkType === "corrections"
      ? `/cases/${caseId}/corrections`
      : undefined;

  return (
    <div className={`rounded-xl ${styles.card} px-5 py-4`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.label}`}>
        Recommended Action
      </p>
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-lg ${styles.iconBg} flex items-center justify-center shrink-0`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${styles.heading}`}>
            {config.heading}
          </p>
          <p className={`text-sm mt-0.5 leading-relaxed ${styles.body}`}>
            {config.body}
          </p>
          {linkHref && config.linkLabel && (
            <Link
              href={linkHref}
              className={`inline-flex items-center gap-1 text-sm font-semibold mt-2 ${styles.link}`}
            >
              {config.linkLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
