import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UploadForm } from "@/components/cases/UploadForm";

export default async function HomeownerUploadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const request = await prisma.documentRequest.findUnique({
    where: { token },
    include: {
      case: {
        select: {
          homeownerName: true,
          address: true,
          city: true,
          state: true,
        },
      },
    },
  });

  if (!request) notFound();

  const isExpired = request.expiresAt < new Date();
  const isCompleted = !!request.completedAt;

  if (isExpired) {
    return (
      <UploadPageShell>
        <p className="text-gray-600 text-sm">
          This upload link has expired. Please contact your contractor for a new
          link.
        </p>
      </UploadPageShell>
    );
  }

  if (isCompleted) {
    return (
      <UploadPageShell>
        <p className="text-gray-600 text-sm">
          Your document has already been submitted. Thank you!
        </p>
      </UploadPageShell>
    );
  }

  return (
    <UploadPageShell>
      <p className="text-gray-700 mb-1">
        Hi {request.case.homeownerName},
      </p>
      <p className="text-sm text-gray-500 mb-6">
        Your contractor needs the following document to proceed with your roofing
        permit at {request.case.address}, {request.case.city}:
      </p>
      <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800 mb-6">
        {request.label}
      </div>
      <UploadForm token={token} docLabel={request.label} caseId={request.caseId} />
    </UploadPageShell>
  );
}

function UploadPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
          PermitPilot
        </p>
        <h1 className="text-lg font-semibold text-gray-900 mb-4">
          Document Upload
        </h1>
        {children}
      </div>
    </div>
  );
}
