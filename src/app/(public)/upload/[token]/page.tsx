import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UploadForm } from "@/components/cases/UploadForm";
import { Shield, Clock, CheckCircle2, Phone } from "lucide-react";

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
        <div className="text-center py-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            This link has expired
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Upload links are valid for 72 hours. Please contact your contractor
            and ask them to send a new link.
          </p>
          <div className="mt-5 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600 flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
            Your contractor will resend the link via text message.
          </div>
        </div>
      </UploadPageShell>
    );
  }

  if (isCompleted) {
    return (
      <UploadPageShell>
        <div className="text-center py-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Document already submitted
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Your <span className="font-medium text-gray-700">{request.label}</span> has
            already been received. Your contractor has everything they need.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            You may close this page. No further action is needed.
          </p>
        </div>
      </UploadPageShell>
    );
  }

  return (
    <UploadPageShell>
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-base font-semibold text-gray-900">
          Hi {request.case.homeownerName},
        </p>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Your contractor needs one document to move forward with your roofing
          permit at{" "}
          <span className="font-medium text-gray-700">
            {request.case.address}, {request.case.city}
          </span>
          .
        </p>
      </div>

      {/* Requested document */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3.5 mb-6">
        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">
          Requested Document
        </p>
        <p className="text-sm font-semibold text-blue-900">{request.label}</p>
      </div>

      {/* Upload form */}
      <UploadForm token={token} docLabel={request.label} caseId={request.caseId} />

      {/* Trust footer */}
      <div className="mt-6 pt-5 border-t border-gray-100">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Secure upload
          </span>
          <span>·</span>
          <span>One-time link</span>
          <span>·</span>
          <span>
            Expires{" "}
            {request.expiresAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </UploadPageShell>
  );
}

function UploadPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center pt-12 pb-16 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
          {/* Card header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold leading-none">P</span>
              </div>
              <span className="text-sm font-bold text-gray-800 tracking-tight">
                PermitPilot
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
              <Shield className="w-3 h-3" />
              Secure upload
            </div>
          </div>

          {/* Card body */}
          <div className="px-6 py-6">{children}</div>
        </div>

        {/* Below-card note */}
        <p className="text-center text-xs text-gray-400 mt-4">
          This link was sent to you by your roofing contractor via PermitPilot.
        </p>
      </div>
    </div>
  );
}
