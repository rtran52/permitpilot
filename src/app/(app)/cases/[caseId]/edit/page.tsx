import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, Check, Building2, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

async function updateCase(caseId: string, formData: FormData) {
  "use server";
  const user = await requireUser();

  // Verify the case belongs to this user's company
  const existing = await prisma.permitCase.findFirst({
    where: { id: caseId, companyId: user.companyId },
    select: { id: true },
  });
  if (!existing) return;

  const address = (formData.get("address") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const zip = (formData.get("zip") as string)?.trim();
  const jurisdictionId = formData.get("jurisdictionId") as string;
  const homeownerName = (formData.get("homeownerName") as string)?.trim();
  const homeownerPhone = (formData.get("homeownerPhone") as string)?.trim();
  const homeownerEmail =
    ((formData.get("homeownerEmail") as string)?.trim()) || null;
  const externalRef =
    ((formData.get("externalRef") as string)?.trim()) || null;

  if (!address || !city || !zip || !jurisdictionId || !homeownerName) {
    return;
  }

  await prisma.permitCase.update({
    where: { id: caseId },
    data: {
      address,
      city,
      zip,
      jurisdictionId,
      homeownerName,
      homeownerPhone,
      homeownerEmail,
      externalRef,
    },
  });

  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}`);
}

export default async function EditCasePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const user = await requireUser();

  const [permitCase, jurisdictions] = await Promise.all([
    prisma.permitCase.findFirst({
      where: { id: caseId, companyId: user.companyId },
      include: { jurisdiction: true },
    }),
    prisma.jurisdiction.findMany({ orderBy: [{ state: "asc" }, { name: "asc" }] }),
  ]);

  if (!permitCase) notFound();

  const updateCaseForId = updateCase.bind(null, caseId);

  return (
    <div className="max-w-2xl">
      {/* Back link */}
      <Link
        href={`/cases/${caseId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {permitCase.address}
      </Link>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Edit Case
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Update job details for this permit case. Status and documents are
          managed from the case detail page.
        </p>
      </div>

      <form action={updateCaseForId} className="space-y-4">
        {/* Property section */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Property</p>
              <p className="text-xs text-gray-400">
                Job site address and permit jurisdiction
              </p>
            </div>
          </div>

          <div className="px-5 py-5 space-y-4">
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                name="address"
                required
                defaultValue={permitCase.address}
                placeholder="1234 Oak Street"
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  required
                  defaultValue={permitCase.city}
                  placeholder="Tampa"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  name="zip"
                  required
                  defaultValue={permitCase.zip}
                  placeholder="33601"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="jurisdictionId">County / Jurisdiction</Label>
              <Select
                name="jurisdictionId"
                required
                defaultValue={permitCase.jurisdictionId}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select a county…" />
                </SelectTrigger>
                <SelectContent>
                  {jurisdictions.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.name}, {j.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-amber-600 mt-1.5">
                Changing the jurisdiction updates the document checklist for
                this case.
              </p>
            </div>
          </div>
        </div>

        {/* Homeowner section */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Homeowner</p>
              <p className="text-xs text-gray-400">
                Contact info used to send document requests via SMS
              </p>
            </div>
          </div>

          <div className="px-5 py-5 space-y-4">
            <div>
              <Label htmlFor="homeownerName">Full Name</Label>
              <Input
                id="homeownerName"
                name="homeownerName"
                required
                defaultValue={permitCase.homeownerName}
                placeholder="Jane Smith"
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="homeownerPhone">
                  Phone Number{" "}
                  <span className="text-gray-400 font-normal">(for SMS requests)</span>
                </Label>
                <Input
                  id="homeownerPhone"
                  name="homeownerPhone"
                  type="tel"
                  defaultValue={permitCase.homeownerPhone}
                  placeholder="(813) 555-0100"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="homeownerEmail">
                  Email{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="homeownerEmail"
                  name="homeownerEmail"
                  type="email"
                  defaultValue={permitCase.homeownerEmail ?? ""}
                  placeholder="jane@example.com"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="pt-1 border-t border-gray-100">
              <Label htmlFor="externalRef">
                CRM Job #{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="externalRef"
                name="externalRef"
                defaultValue={permitCase.externalRef ?? ""}
                placeholder="e.g. JN-1042"
                className="mt-1.5"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Reference number from JobNimbus, AccuLynx, or your job
                management tool.
              </p>
            </div>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href={`/cases/${caseId}`}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 px-6"
          >
            <Check className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
