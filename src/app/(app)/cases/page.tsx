import { requireUser } from "@/lib/auth";
import { getCasesForCompany } from "@/lib/cases";
import { CaseTable } from "@/components/cases/CaseTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CasesPage() {
  const user = await requireUser();
  const cases = await getCasesForCompany(user.companyId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          All Cases{" "}
          <span className="text-base font-normal text-gray-400">
            ({cases.length})
          </span>
        </h1>
        <Button asChild size="sm">
          <Link href="/cases/new">+ New Case</Link>
        </Button>
      </div>

      {cases.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm text-gray-500">No cases yet.</p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/cases/new">Create your first case</Link>
          </Button>
        </div>
      ) : (
        <CaseTable cases={cases} />
      )}
    </div>
  );
}
