import { requireUser } from "@/lib/auth";
import { getCaseWithDetails } from "@/lib/cases";
import { notFound } from "next/navigation";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import { StatusTransitionForm } from "@/components/cases/StatusTransitionForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CaseStatus } from "@prisma/client";

// Valid next transitions shown on the case detail page
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

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/cases"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← Cases
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 mt-1">
            {permitCase.address}
          </h1>
          <p className="text-sm text-gray-500">
            {permitCase.city}, {permitCase.state} {permitCase.zip} ·{" "}
            {permitCase.jurisdiction.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CaseStatusBadge status={permitCase.status} />
          <span className="text-xs text-gray-400">
            {daysSince(permitCase.updatedAt)}d in status
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: job info + status actions */}
        <div className="col-span-2 space-y-5">
          {/* Job details */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
            <h2 className="text-sm font-medium text-gray-700">Homeowner</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">{permitCase.homeownerName}</p>
              <p>{formatPhone(permitCase.homeownerPhone)}</p>
              {permitCase.homeownerEmail && <p>{permitCase.homeownerEmail}</p>}
            </div>
            {permitCase.permitNumber && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mt-3">
                  Permit #
                </p>
                <p className="text-sm font-mono text-gray-700">
                  {permitCase.permitNumber}
                </p>
              </div>
            )}
            {permitCase.externalRef && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mt-3">
                  CRM Job #
                </p>
                <p className="text-sm text-gray-700">{permitCase.externalRef}</p>
              </div>
            )}
          </div>

          {/* Unresolved corrections */}
          {unresolvedCorrections.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-5">
              <h2 className="text-sm font-medium text-red-700 mb-3">
                Open Corrections ({unresolvedCorrections.length})
              </h2>
              <ul className="space-y-2">
                {unresolvedCorrections.map((c) => (
                  <li key={c.id} className="text-sm text-red-800">
                    {c.content}
                  </li>
                ))}
              </ul>
              <Button asChild size="sm" variant="outline" className="mt-3">
                <Link href={`/cases/${caseId}/corrections`}>
                  Manage corrections →
                </Link>
              </Button>
            </div>
          )}

          {/* Status history */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-medium text-gray-700 mb-3">
              Status History
            </h2>
            <ol className="space-y-2">
              {permitCase.statusHistory.map((h) => (
                <li key={h.id} className="flex items-start gap-3 text-sm">
                  <span className="text-gray-400 text-xs mt-0.5 w-20 shrink-0">
                    {h.createdAt.toLocaleDateString()}
                  </span>
                  <span className="text-gray-700">
                    {h.fromStatus ? `${h.fromStatus} → ` : ""}
                    <span className="font-medium">{h.toStatus}</span>
                    {h.note && (
                      <span className="text-gray-400"> · {h.note}</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right: actions */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Actions</h2>
            <div className="space-y-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/cases/${caseId}/documents`}>
                  View Documents
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/cases/${caseId}/corrections`}>
                  Corrections
                  {unresolvedCorrections.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-red-100 text-red-700 text-xs px-1.5 py-0.5">
                      {unresolvedCorrections.length}
                    </span>
                  )}
                </Link>
              </Button>
            </div>
          </div>

          {nextStatuses.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-medium text-gray-700 mb-3">
                Move to...
              </h2>
              <StatusTransitionForm
                caseId={caseId}
                nextStatuses={nextStatuses}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
