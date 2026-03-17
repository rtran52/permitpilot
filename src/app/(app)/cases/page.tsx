import { requireUser } from "@/lib/auth";
import { getCasesForCompany } from "@/lib/cases";
import { CaseTable } from "@/components/cases/CaseTable";
import { CaseFilters } from "@/components/cases/CaseFilters";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FolderOpen, Plus } from "lucide-react";
import { CaseStatus } from "@prisma/client";
import { Suspense } from "react";

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await requireUser();
  const { q, status } = await searchParams;

  const isValidStatus = (s: string | undefined): s is CaseStatus =>
    !!s && Object.values(CaseStatus).includes(s as CaseStatus);

  const filters = {
    ...(q ? { q } : {}),
    ...(isValidStatus(status) ? { status: status as CaseStatus } : {}),
  };

  const hasFilters = !!(q || isValidStatus(status));

  const [allCases, filteredCases] = await Promise.all([
    getCasesForCompany(user.companyId),
    hasFilters ? getCasesForCompany(user.companyId, filters) : Promise.resolve(null),
  ]);

  const displayCases = filteredCases ?? allCases;
  const totalCount = allCases.length;
  const filteredCount = displayCases.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            All Cases
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalCount} permit case{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/cases/new">
            <Plus className="w-4 h-4" />
            New Case
          </Link>
        </Button>
      </div>

      {totalCount === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FolderOpen className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700">No cases yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-5">
            Create your first permit case to start tracking your workflow.
          </p>
          <Button asChild size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/cases/new">
              <Plus className="w-4 h-4" />
              New Case
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <Suspense fallback={<div className="h-16 rounded-lg bg-gray-50 animate-pulse" />}>
            <CaseFilters totalCount={totalCount} filteredCount={filteredCount} />
          </Suspense>

          {displayCases.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
              <p className="text-sm font-semibold text-gray-700">No matching cases</p>
              <p className="text-xs text-gray-400 mt-1">
                Try adjusting your search or filter.
              </p>
            </div>
          ) : (
            <CaseTable cases={displayCases} />
          )}
        </>
      )}
    </div>
  );
}
