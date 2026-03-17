import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TradeType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

async function createCase(formData: FormData) {
  "use server";
  const user = await requireUser();

  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const zip = formData.get("zip") as string;
  const jurisdictionId = formData.get("jurisdictionId") as string;
  const homeownerName = formData.get("homeownerName") as string;
  const homeownerPhone = formData.get("homeownerPhone") as string;
  const homeownerEmail = (formData.get("homeownerEmail") as string) || null;
  const externalRef = (formData.get("externalRef") as string) || null;

  const permitCase = await prisma.permitCase.create({
    data: {
      address,
      city,
      state,
      zip,
      trade: TradeType.ROOFING,
      jurisdictionId,
      homeownerName,
      homeownerPhone,
      homeownerEmail,
      externalRef,
      companyId: user.companyId,
    },
  });

  await prisma.statusHistory.create({
    data: {
      caseId: permitCase.id,
      fromStatus: null,
      toStatus: "NEW",
      changedBy: user.id,
      note: "Case created",
    },
  });

  redirect(`/cases/${permitCase.id}`);
}

export default async function NewCasePage() {
  await requireUser();
  const jurisdictions = await prisma.jurisdiction.findMany({
    orderBy: [{ state: "asc" }, { name: "asc" }],
  });

  return (
    <div className="max-w-2xl">
      {/* Back link */}
      <Link
        href="/cases"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All Cases
      </Link>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          New Permit Case
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter the job details to open a permit tracking case. The document
          checklist will load automatically based on the selected jurisdiction.
        </p>
      </div>

      <form action={createCase} className="space-y-4">
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
                  placeholder="33601"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="jurisdictionId">County / Jurisdiction</Label>
              <Select name="jurisdictionId" required>
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
              {/* hidden state field — derived from jurisdiction in real app */}
              <Input name="state" type="hidden" value="FL" readOnly />
              <p className="text-xs text-gray-400 mt-1.5">
                Determines which documents are required for this permit.{" "}
                Currently supporting Florida jurisdictions only.
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
                Contact info used to request documents via SMS
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
            href="/cases"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 px-6"
          >
            Create Case
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
