import { requireUser } from "@/lib/auth";
import { getCaseWithDetails } from "@/lib/cases";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { RequestDocButton } from "@/components/cases/RequestDocButton";

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
  const pendingRequests = permitCase.documentRequests.filter(
    (r) => !r.completedAt
  );

  // Map: docType → uploaded document
  const uploadedByType = Object.fromEntries(
    documents.map((d) => [d.docType, d])
  );

  // Map: docType → pending request
  const pendingByType = Object.fromEntries(
    pendingRequests.map((r) => [r.docType, r])
  );

  const allRequired = requirements.filter((r) => r.required);
  const allOptional = requirements.filter((r) => !r.required);

  const completedCount = requirements.filter((r) => uploadedByType[r.docType])
    .length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/cases/${caseId}`}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← {permitCase.address}
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 mt-1">
            Documents
          </h1>
          <p className="text-sm text-gray-500">
            {completedCount} of {requirements.length} uploaded ·{" "}
            {permitCase.jurisdiction.name}
          </p>
        </div>
      </div>

      <DocSection
        title="Required"
        requirements={allRequired}
        uploadedByType={uploadedByType}
        pendingByType={pendingByType}
        caseId={caseId}
        homeownerPhone={permitCase.homeownerPhone}
        homeownerName={permitCase.homeownerName}
      />

      {allOptional.length > 0 && (
        <DocSection
          title="Optional"
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
  requirements,
  uploadedByType,
  pendingByType,
  caseId,
  homeownerPhone,
  homeownerName,
}: {
  title: string;
  requirements: Array<{ id: string; docType: string; label: string }>;
  uploadedByType: Record<string, { fileUrl: string; label: string }>;
  pendingByType: Record<string, { token: string }>;
  caseId: string;
  homeownerPhone: string;
  homeownerName: string;
}) {
  return (
    <section>
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
        {title}
      </h2>
      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
        {requirements.map((req) => {
          const doc = uploadedByType[req.docType];
          const pending = pendingByType[req.docType];

          return (
            <div
              key={req.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {doc ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                )}
                <div>
                  <p className="text-sm text-gray-800">{req.label}</p>
                  {pending && !doc && (
                    <p className="text-xs text-yellow-600 mt-0.5">
                      Requested — awaiting homeowner upload
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {doc ? (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <RequestDocButton
                    caseId={caseId}
                    docType={req.docType}
                    docLabel={req.label}
                    homeownerPhone={homeownerPhone}
                    homeownerName={homeownerName}
                    alreadySent={!!pending}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
