import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TradeType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        New Permit Case
      </h1>

      <form action={createCase} className="space-y-5">
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-gray-700 mb-2">
            Property
          </legend>

          <div>
            <Label htmlFor="address">Street Address</Label>
            <Input id="address" name="address" required className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" name="zip" required className="mt-1" />
            </div>
          </div>

          <div>
            <Label htmlFor="jurisdictionId">County / Jurisdiction</Label>
            <Select name="jurisdictionId" required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select jurisdiction" />
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
          </div>
        </fieldset>

        <fieldset className="space-y-4 pt-2">
          <legend className="text-sm font-medium text-gray-700 mb-2">
            Homeowner
          </legend>

          <div>
            <Label htmlFor="homeownerName">Full Name</Label>
            <Input
              id="homeownerName"
              name="homeownerName"
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="homeownerPhone">Phone</Label>
              <Input
                id="homeownerPhone"
                name="homeownerPhone"
                type="tel"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="homeownerEmail">Email (optional)</Label>
              <Input
                id="homeownerEmail"
                name="homeownerEmail"
                type="email"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="externalRef">CRM Job # (optional)</Label>
            <Input id="externalRef" name="externalRef" className="mt-1" />
          </div>
        </fieldset>

        <div className="pt-2">
          <Button type="submit" className="w-full">
            Create Case
          </Button>
        </div>
      </form>
    </div>
  );
}
