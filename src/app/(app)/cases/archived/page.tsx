import { requireUser } from "@/lib/auth";
import { getArchivedCasesForCompany } from "@/lib/cases";
import { CaseStatusBadge } from "@/components/cases/CaseStatusBadge";
import { ArchiveButton } from "@/components/cases/ArchiveButton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Archive, FolderOpen, Search } from "lucide-react";
import { Suspense } from "react";

export default async function ArchivedCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const { q } = await searchParams;

  const [allArchived, filteredArchived] = await Promise.all([
    getArchivedCasesForCompany(user.companyId),
    q ? getArchivedCasesForCompany(user.companyId, { q }) : Promise.resolve(null),
  ]);

  const displayCases = filteredArchived ?? allArchived;
  const totalCount = allArchived.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Archived Cases
            </h1>
            {totalCount > 0 && (
              <span className="inline-flex items-center text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5">
                {totalCount}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Completed permits moved out of your active workflow
          </p>
        </div>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="gap-1.5 text-gray-600"
        >
          <Link href="/cases">
            <FolderOpen className="w-4 h-4" />
            Active Cases
          </Link>
        </Button>
      </div>

      {totalCount === 0 ? (
        // Empty state
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Archive className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700">No archived cases</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            Once a permit is complete, archive it from the case detail page to
            keep your active list clean.
          </p>
        </div>
      ) : (
        <>
          {/* Search */}
          <Suspense fallback={null}>
            <form method="GET" className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="Search archived cases…"
                  className="w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                />
              </div>
              {q && (
                <Button asChild size="sm" variant="outline" className="text-xs text-gray-500">
                  <Link href="/cases/archived">Clear</Link>
                </Button>
              )}
            </form>
          </Suspense>

          {displayCases.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
              <p className="text-sm font-semibold text-gray-700">No matching cases</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">
                      Address
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                      Homeowner
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                      Jurisdiction
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                      Archived
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayCases.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/cases/${c.id}`}
                          className="font-medium text-gray-800 hover:text-blue-600 transition-colors"
                        >
                          {c.address}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {c.city}, {c.state}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">
                        {c.homeownerName}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs">
                        {c.jurisdiction.name}
                      </td>
                      <td className="px-4 py-3.5">
                        <CaseStatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400 tabular-nums">
                        {c.archivedAt
                          ? c.archivedAt.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <ArchiveButton
                          caseId={c.id}
                          archived={true}
                          redirectAfterArchive="/cases/archived"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
