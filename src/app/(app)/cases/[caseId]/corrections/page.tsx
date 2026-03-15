import { requireUser } from "@/lib/auth";
import { getCaseWithDetails } from "@/lib/cases";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Circle } from "lucide-react";

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
      <div>
        <Link
          href={`/cases/${caseId}`}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← {permitCase.address}
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 mt-1">
          Corrections
        </h1>
      </div>

      {/* Add correction form */}
      <form action={addCorrectionWithId} className="space-y-2">
        <Textarea
          name="content"
          placeholder="Paste correction comment from permit office..."
          rows={3}
          required
        />
        <Button type="submit" size="sm" variant="destructive">
          Log Correction
        </Button>
      </form>

      {/* Open corrections */}
      {open.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-red-600 uppercase tracking-wide mb-3">
            Open ({open.length})
          </h2>
          <div className="space-y-2">
            {open.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
              >
                <Circle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{c.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {c.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <form
                  action={resolveCorrection.bind(null, c.id, caseId)}
                >
                  <Button size="sm" variant="outline" type="submit" className="text-xs h-7">
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
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            Resolved ({resolved.length})
          </h2>
          <div className="space-y-2">
            {resolved.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 line-through">{c.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Resolved {c.resolvedAt?.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {open.length === 0 && resolved.length === 0 && (
        <p className="text-sm text-gray-400">No corrections logged yet.</p>
      )}
    </div>
  );
}
