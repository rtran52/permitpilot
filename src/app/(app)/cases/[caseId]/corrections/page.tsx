import { requireUser } from "@/lib/auth";
import { getCaseWithDetails } from "@/lib/cases";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Circle,
  ArrowLeft,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";

async function addCorrection(caseId: string, formData: FormData) {
  "use server";
  const content = formData.get("content") as string;
  if (!content?.trim()) return;

  await prisma.correctionNote.create({
    data: { caseId, content: content.trim() },
  });
  redirect(`/cases/${caseId}/corrections`);
}

async function resolveCorrection(correctionId: string, caseId: string) {
  "use server";
  await prisma.correctionNote.update({
    where: { id: correctionId },
    data: { resolved: true, resolvedAt: new Date() },
  });
  redirect(`/cases/${caseId}/corrections`);
}

export default async function CorrectionsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const user = await requireUser();
  const permitCase = await getCaseWithDetails(caseId, user.companyId);

  if (!permitCase) notFound();

  const open = permitCase.corrections.filter((c) => !c.resolved);
  const resolved = permitCase.corrections.filter((c) => c.resolved);

  const addCorrectionWithId = addCorrection.bind(null, caseId);

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
          Corrections
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {open.length > 0
            ? `${open.length} open correction${open.length > 1 ? "s" : ""} need attention`
            : "No open corrections"}
        </p>
      </div>

      {/* Log correction form */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
              Log a Correction
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Copy the correction text directly from the permit office notice
            </p>
          </div>
        </div>
        <div className="px-5 py-4">
          <form action={addCorrectionWithId} className="space-y-3">
            <Textarea
              name="content"
              placeholder={`e.g. "Missing homeowner signature on page 2 of the permit application. Required before the application can proceed."`}
              rows={3}
              required
              className="resize-none bg-gray-50 border-gray-200 text-sm focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition-colors"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Log Correction
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Open corrections */}
      {open.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-bold text-red-600 uppercase tracking-widest">
              Open
            </h2>
            <span className="text-xs font-semibold bg-red-100 text-red-600 rounded-full px-2 py-0.5">
              {open.length}
            </span>
          </div>
          <div className="space-y-2">
            {open.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4"
              >
                <div className="w-6 h-6 rounded-full bg-red-100 border border-red-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Circle className="w-3 h-3 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {c.content}
                  </p>
                  <p className="text-xs text-red-400 mt-1.5">
                    Logged{" "}
                    {c.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <form action={resolveCorrection.bind(null, c.id, caseId)} className="shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    type="submit"
                    className="text-xs h-8 border-red-200 text-red-700 hover:bg-red-100 bg-white"
                  >
                    Resolve
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Resolved corrections */}
      {resolved.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Resolved
            </h2>
            <span className="text-xs font-medium bg-gray-100 text-gray-400 rounded-full px-2 py-0.5">
              {resolved.length}
            </span>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
            {resolved.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-4 px-5 py-4"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-400 line-through leading-relaxed">
                    {c.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Resolved{" "}
                    {c.resolvedAt?.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {open.length === 0 && resolved.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-14 text-center px-6">
          <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <ClipboardList className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-600">
            No corrections logged
          </p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
            When the permit office sends back a rejection or correction notice,
            log each item above so nothing falls through the cracks.
          </p>
        </div>
      )}
    </div>
  );
}
