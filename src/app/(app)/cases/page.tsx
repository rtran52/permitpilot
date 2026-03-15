import { requireUser } from "@/lib/auth";
import { getCasesForCompany } from "@/lib/cases";
import { CaseTable } from "@/components/cases/CaseTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FolderOpen, Plus } from "lucide-react";

export default async function CasesPage() {
  const user = await requireUser();
  const cases = await getCasesForCompany(user.companyId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            All Cases
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {cases.length} permit case{cases.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/cases/new">
            <Plus className="w-4 h-4" />
            New Case
          </Link>
        </Button>
      </div>

      {cases.length === 0 ? (
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
        <CaseTable cases={cases} />
      )}
    </div>
  );
}
