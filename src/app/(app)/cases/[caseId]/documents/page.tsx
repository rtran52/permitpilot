import { requireUser } from "@/lib/auth";
import { getCaseWithDetails } from "@/lib/cases";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  ArrowLeft,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { RequestDocButton } from "@/components/cases/RequestDocButton";
import { OfficeUploadButton } from "@/components/cases/OfficeUploadButton";
import { BatchRequestButton } from "@/components/cases/BatchRequestButton";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const user = await requireUser();
  const permitCase = await getCaseWithDetails(caseId, user.companyId);

  if (!permitCase) notFound();

  const requirements = permitCase.jurisdiction.requirements;
  const documents = permitCase.documents;
  const pendingRequests = permitCase.documentRequests.filter((r) => !r.completedAt);

  const uploadedByType = Object.fromEntries(documents.map((d) => [d.docType, d]));
  const pendingByType = Object.fromEntries(pendingRequests.map((r) => [r.docType, r]));

  const allRequired = requirements.filter((r) => r.required);
  const allOptional = requirements.filter((r) => !r.required);

  const requiredUploaded = allRequired.filter((r) => uploadedByType[r.docType]).length;
  const allRequiredDone =
    requiredUploaded === allRequired.length && allRequired.length > 0;
  const progressPct =
    allRequired.length > 0
      ? Math.round((requiredUploaded / allRequired.length) * 100)
      : 100;

  const missingRequired = allRequired.filter(
    (r) => !uploadedByType[r.docType] && !pendingByType[r.docType]
  );
  const requestedCount = allRequired.filter(
    (r) => !uploadedByType[r.docType] && pendingByType[r.docType]
  ).length;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <Link
          href={`/cases/${caseId}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {permitCase.address}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-2">
          Documents
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{permitCase.jurisdiction.name}</p>
      </div>

      {/* Progress card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-5 py-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">Required documents</p>
            <div className="flex items-center gap-3 mt-1.5">
              {missingRequired.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  {missingRequired.length} missing
                </span>
              )}
              {requestedCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                  <Clock className="w-3 h-3" />
                  {requestedCount} requested
                </span>
              )}
              {requiredUploaded > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" />
                  {requiredUploaded} received
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <BatchRequestButton
              caseId={caseId}
              docs={missingRequired.map((r) => ({
                docType: r.docType,
                docLabel: r.label,
              }))}
              homeownerPhone={permitCase.homeownerPhone}
              homeownerName={permitCase.homeownerName}
            />
            <div className="text-right">
              <span
                className={`text-2xl font-bold tabular-nums ${
                  allRequiredDone ? "text-emerald-600" : "text-gray-800"
                }`}
              >
                {requiredUploaded}
              </span>
              <span className="text-lg font-semibold text-gray-300">
                /{allRequired.length}
              </span>
            </div>
          </div>
        </div>

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              allRequiredDone ? "bg-emerald-500" : "bg-blue-500"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {allRequiredDone ? (
          <div className="flex items-center gap-2 mt-3 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
            <FileCheck className="w-3.5 h-3.5 shrink-0" />
            All required documents received — ready to submit to the permit office
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-2.5">
            {allRequired.length - requiredUploaded} document
            {allRequired.length - requiredUploaded !== 1 ? "s" : ""} still needed
            before submission
          </p>
        )}
      </div>

      {/* Required docs */}
      <DocSection
        title="Required"
        isRequired
        requirements={allRequired}
        uploadedByType={uploadedByType}
        pendingByType={pendingByType}
        caseId={caseId}
        homeownerPhone={permitCase.homeownerPhone}
        homeownerName={permitCase.homeownerName}
      />

      {/* Optional docs */}
      {allOptional.length > 0 && (
        <DocSection
          title="Optional"
          isRequired={false}
          requirements={allOptional}
          uploadedByType={uploadedByType}
          pendingByType={pendingByType}
          caseId={caseId}
          homeownerPhone={permitCase.homeownerPhone}
          homeownerName={permitCase.homeownerName}
        />
      )}
    </div>
  );
}

function DocSection({
  title,
  isRequired,
  requirements,
  uploadedByType,
  pendingByType,
  caseId,
  homeownerPhone,
  homeownerName,
}: {
  title: string;
  isRequired: boolean;
  requirements: Array<{ id: string; docType: string; label: string }>;
  uploadedByType: Record<string, { fileUrl: string; label: string }>;
  pendingByType: Record<string, { token: string }>;
  caseId: string;
  homeownerPhone: string;
  homeownerName: string;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2
          className={`text-xs font-bold uppercase tracking-widest ${
            isRequired ? "text-gray-700" : "text-gray-400"
          }`}
        >
          {title}
        </h2>
        <span
          className={`text-xs font-medium rounded-full px-2 py-0.5 ${
            isRequired ? "bg-gray-100 text-gray-500" : "bg-gray-50 text-gray-400"
          }`}
        >
          {requirements.length}
        </span>
        {!isRequired && (
          <span className="text-xs text-gray-400">— submit if applicable</span>
        )}
      </div>
      <div
        className={`rounded-xl border bg-white shadow-sm overflow-hidden divide-y ${
          isRequired
            ? "border-gray-200 divide-gray-100"
            : "border-gray-100 divide-gray-50"
        }`}
      >
        {requirements.map((req) => {
          const doc = uploadedByType[req.docType];
          const pending = pendingByType[req.docType];

          // Determine visual state
          const state: "received" | "requested" | "missing" | "optional-missing" =
            doc
              ? "received"
              : pending
              ? "requested"
              : isRequired
              ? "missing"
              : "optional-missing";

          const rowAccent =
            state === "received"
              ? "border-l-[3px] border-l-emerald-400 bg-emerald-50/25"
              : state === "requested"
              ? "border-l-[3px] border-l-amber-400 bg-amber-50/20"
              : state === "missing"
              ? "border-l-[3px] border-l-red-300"
              : "border-l-[3px] border-l-transparent";

          const stateChip =
            state === "received" ? (
              <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5 shrink-0">
                Received
              </span>
            ) : state === "missing" ? (
              <span className="text-[10px] font-bold uppercase tracking-wide text-red-500 bg-red-50 border border-red-200 rounded-full px-1.5 py-0.5 shrink-0">
                Missing
              </span>
            ) : null;

          return (
            <div
              key={req.id}
              className={`flex items-center justify-between px-5 py-3.5 ${rowAccent}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {state === "received" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : state === "requested" ? (
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Circle
                    className={`w-4 h-4 shrink-0 ${
                      state === "missing" ? "text-red-300" : "text-gray-200"
                    }`}
                  />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`text-sm font-medium ${
                        state === "received"
                          ? "text-gray-400 line-through"
                          : "text-gray-800"
                      }`}
                    >
                      {req.label}
                    </p>
                    {stateChip}
                  </div>
                  {state === "requested" && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      Awaiting homeowner upload
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-4">
                {state === "received" ? (
                  <a
                    href={doc!.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    View
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <>
                    <RequestDocButton
                      caseId={caseId}
                      docType={req.docType}
                      docLabel={req.label}
                      homeownerPhone={homeownerPhone}
                      homeownerName={homeownerName}
                      alreadySent={state === "requested"}
                      priority={isRequired && state === "missing"}
                    />
                    <OfficeUploadButton
                      caseId={caseId}
                      docType={req.docType}
                      docLabel={req.label}
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
