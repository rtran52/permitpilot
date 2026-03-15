import { requireUser } from "@/lib/auth";
import { getCasesForCompany } from "@/lib/cases";
import { CaseStatus } from "@prisma/client";
import { CaseTable } from "@/components/cases/CaseTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Layers, Plus } from "lucide-react";

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
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {cases.length === 0
              ? "No permit cases yet"
              : `${activeCases.length} active · ${needsAttention.length > 0 ? `${needsAttention.length} need attention` : "all clear"}`}
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Link href="/cases/new">
            <Plus className="w-4 h-4" />
            New Case
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-5">
        <StatCard
          label="Active Permits"
          value={activeCases.length}
          subtext="in workflow"
          icon={<Layers className="w-5 h-5" />}
          href="#active"
        />
        <StatCard
          label="Needs Attention"
          value={needsAttention.length}
          subtext={
            needsAttention.length > 0
              ? "corrections, stale, or overdue"
              : "all cases on track"
          }
          icon={<AlertCircle className="w-5 h-5" />}
          href="#attention"
          urgent={needsAttention.length > 0}
        />
        <StatCard
          label="Ready to Schedule"
          value={recentlyApproved.length}
          subtext="permit approved, last 14 days"
          icon={<CheckCircle2 className="w-5 h-5" />}
          positive={recentlyApproved.length > 0}
        />
      </div>

      {/* Needs attention — always visible */}
      <section id="attention">
        <SectionHeader
          label="Needs Attention"
          count={needsAttention.length}
          urgent={needsAttention.length > 0}
          description={
            needsAttention.length > 0
              ? "corrections logged, docs overdue, or stale 5+ days"
              : undefined
          }
        />
        {needsAttention.length === 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 py-8 px-6 flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                All clear — no cases need attention
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Cases with corrections, overdue docs, or no activity in 5+ days will appear here.
              </p>
            </div>
          </div>
        ) : (
          <CaseTable cases={needsAttention} />
        )}
      </section>

      {/* Active cases */}
      <section id="active">
        <SectionHeader label="Permit Pipeline" count={activeCases.length} />
        {activeCases.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-600">
              No active permits yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Create a permit case when a new roofing job is sold.
            </p>
            <Button
              asChild
              size="sm"
              className="mt-4 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link href="/cases/new">
                <Plus className="w-4 h-4" />
                New Case
              </Link>
            </Button>
          </div>
        ) : (
          <CaseTable cases={activeCases} />
        )}
      </section>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({
  label,
  count,
  urgent,
  description,
}: {
  label: string;
  count?: number;
  urgent?: boolean;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <h2
        className={`text-xs font-bold uppercase tracking-widest ${
          urgent ? "text-red-600" : "text-gray-500"
        }`}
      >
        {label}
      </h2>
      {count !== undefined && (
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            urgent
              ? "bg-red-100 text-red-600"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {count}
        </span>
      )}
      {description && (
        <span className={`text-xs ${urgent ? "text-red-400" : "text-gray-400"}`}>
          — {description}
        </span>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  icon,
  href,
  urgent,
  positive,
}: {
  label: string;
  value: number;
  subtext: string;
  icon: React.ReactNode;
  href?: string;
  urgent?: boolean;
  positive?: boolean;
}) {
  const borderClass = urgent
    ? "border-red-200"
    : positive && value > 0
    ? "border-emerald-200"
    : "border-gray-200";

  const numClass = urgent
    ? "text-red-700"
    : positive && value > 0
    ? "text-emerald-700"
    : "text-gray-900";

  const labelClass = urgent
    ? "text-red-700"
    : positive && value > 0
    ? "text-emerald-700"
    : "text-gray-700";

  const subtextClass = urgent
    ? "text-red-400"
    : positive && value > 0
    ? "text-emerald-500"
    : "text-gray-400";

  const iconBgClass = urgent
    ? "bg-red-50 text-red-400"
    : positive && value > 0
    ? "bg-emerald-50 text-emerald-500"
    : "bg-gray-100 text-gray-400";

  const content = (
    <div
      className={`rounded-xl border ${borderClass} bg-white shadow-sm px-5 py-5 h-full`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-9 h-9 rounded-lg ${iconBgClass} flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
        <span className={`text-3xl font-bold tabular-nums ${numClass}`}>
          {value}
        </span>
      </div>
      <p className={`text-sm font-semibold ${labelClass}`}>{label}</p>
      <p className={`text-xs mt-0.5 ${subtextClass}`}>{subtext}</p>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block hover:opacity-90 transition-opacity">
        {content}
      </a>
    );
  }
  return content;
}

function staleDays(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}
