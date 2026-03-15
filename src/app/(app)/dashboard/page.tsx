import { requireUser } from "@/lib/auth";
import { getCasesForCompany } from "@/lib/cases";
import { CaseStatus } from "@prisma/client";
import { CaseTable } from "@/components/cases/CaseTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await requireUser();
  const cases = await getCasesForCompany(user.companyId);

  const needsAttention = cases.filter(
    (c) =>
      c.status === CaseStatus.CORRECTIONS_REQUIRED ||
      c.corrections.length > 0 ||
      staleDays(c.updatedAt) >= 5
  );

  const activeCases = cases.filter(
    (c) =>
      c.status !== CaseStatus.READY_TO_START &&
      c.status !== CaseStatus.APPROVED
  );

  const recentlyApproved = cases.filter(
    (c) =>
      (c.status === CaseStatus.APPROVED ||
        c.status === CaseStatus.READY_TO_START) &&
      staleDays(c.updatedAt) <= 14
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <Button asChild size="sm">
          <Link href="/cases/new">+ New Case</Link>
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active Cases" value={activeCases.length} />
        <StatCard
          label="Needs Attention"
          value={needsAttention.length}
          highlight={needsAttention.length > 0}
        />
        <StatCard label="Approved (14d)" value={recentlyApproved.length} />
      </div>

      {needsAttention.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-red-600 mb-3 uppercase tracking-wide">
            Needs Attention
          </h2>
          <CaseTable cases={needsAttention} />
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">
          Active Cases
        </h2>
        {activeCases.length === 0 ? (
          <p className="text-sm text-gray-400">No active cases.</p>
        ) : (
          <CaseTable cases={activeCases} />
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-5 py-4 ${
        highlight ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function staleDays(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}
