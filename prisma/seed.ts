import "dotenv/config";
import { PrismaClient, TradeType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Real roofing permit document requirements for Tampa Bay area FL jurisdictions.
// All logic is data-driven — adding a new county or trade means adding rows here,
// not changing application code.

const jurisdictions = [
  {
    name: "Hillsborough County",
    state: "FL",
    requirements: [
      {
        trade: TradeType.ROOFING,
        docType: "SIGNED_CONTRACT",
        label: "Signed Contract",
        required: true,
      },
      {
        trade: TradeType.ROOFING,
        docType: "PERMIT_APPLICATION",
        label: "Permit Application (Signed by Owner)",
        required: true,
      },
      {
        trade: TradeType.ROOFING,
        docType: "NOTICE_OF_COMMENCEMENT",
        label: "Notice of Commencement (if job > $2,500)",
        required: true,
      },
      {
        trade: TradeType.ROOFING,
        docType: "PRODUCT_APPROVAL",
        label: "Florida Product Approval (roofing system)",
        required: true,
      },
      {
        trade: TradeType.ROOFING,
        docType: "HOA_APPROVAL",
        label: "HOA Approval Letter",
        required: false,
      },
      {
        trade: TradeType.ROOFING,
        docType: "CONTRACTORS_LICENSE",
        label: "Contractor's License Copy",
        required: true,
      },
      {
        trade: TradeType.ROOFING,
        docType: "PROOF_OF_INSURANCE",
        label: "Proof of Liability Insurance",
        required: true,
      },
    ],
  },
  {
    name: "Pinellas County",
    state: "FL",
    requirements: [
      {
        trade: TradeType.ROOFING,
        docType: "SIGNED_CONTRACT",
        label: "Signed Contract",
        required: true,
      },
      {
        trade: TradeType.ROOFING,
        docType: "PERMIT_APPLICATION",
        label: "Permit Application (Owner Signature Required)",
        required: true,
      },
      {
        trade: TradeType.ROOFING,
        docType: "NOTICE_OF_COMMENCEMENT",
        label: "Notice of Commencement",
        required: true,
      },
      {
        trade: TradeType.ROOFING,
        docType: "PRODUCT_APPROVAL",
        label: "Florida Product Approval",
        required: true,
      },
      {
        trade: TradeType.ROOFING,
        docType: "HOA_APPROVAL",
        label: "HOA Approval Letter",
        required: false,
      },
      {
        trade: TradeType.ROOFING,
        docType: "CONTRACTORS_LICENSE",
        label: "Contractor's License Copy",
        required: true,
      },
      {
        trade: TradeType.ROOFING,
        docType: "PROOF_OF_INSURANCE",
        label: "Proof of Liability Insurance",
        required: true,
      },
      {
        trade: TradeType.ROOFING,
        docType: "SCOPE_OF_WORK",
        label: "Scope of Work",
        required: true,
      },
    ],
  },
  {
    name: "Pasco County",
    state: "FL",
    requirements: [
      {
        trade: TradeType.ROOFING,
        docType: "SIGNED_CONTRACT",
        label: "Signed Contract",
        required: true,
      },
      {
        trade: TradeType.ROOFING,
        docType: "PERMIT_APPLICATION",
        label: "Permit Application",
        required: true,
      },
      {
        trade: TradeType.ROOFING,
        docType: "NOTICE_OF_COMMENCEMENT",
        label: "Notice of Commencement",
        required: true,
      },
      {
        trade: TradeType.ROOFING,
        docType: "PRODUCT_APPROVAL",
        label: "Florida Product Approval",
        required: true,
      },
      {
        trade: TradeType.ROOFING,
        docType: "HOA_APPROVAL",
        label: "HOA Approval Letter",
        required: false,
      },
      {
        trade: TradeType.ROOFING,
        docType: "CONTRACTORS_LICENSE",
        label: "Contractor's License Copy",
        required: true,
      },
      {
        trade: TradeType.ROOFING,
        docType: "PROOF_OF_INSURANCE",
        label: "Proof of Liability Insurance",
        required: true,
      },
    ],
  },
];

async function main() {
  // Ensure a Company row exists — required for user provisioning to work.
  const existingCompany = await prisma.company.findFirst();
  if (!existingCompany) {
    await prisma.company.create({ data: { name: "My Company" } });
    console.log("  ✓ Created default company");
  } else {
    console.log("  · Company already exists, skipping");
  }

  console.log("Seeding jurisdictions and document requirements...");

  for (const j of jurisdictions) {
    const jurisdiction = await prisma.jurisdiction.upsert({
      where: {
        // Use a synthetic unique key via findFirst + create pattern
        // since Jurisdiction has no natural unique constraint on name+state
        id: j.name.toLowerCase().replace(/\s+/g, "-") + "-" + j.state.toLowerCase(),
      },
      update: {},
      create: {
        id: j.name.toLowerCase().replace(/\s+/g, "-") + "-" + j.state.toLowerCase(),
        name: j.name,
        state: j.state,
      },
    });

    // Clear existing requirements for idempotent re-seeding
    await prisma.documentRequirement.deleteMany({
      where: { jurisdictionId: jurisdiction.id },
    });

    await prisma.documentRequirement.createMany({
      data: j.requirements.map((r) => ({
        jurisdictionId: jurisdiction.id,
        trade: r.trade,
        docType: r.docType,
        label: r.label,
        required: r.required,
      })),
    });

    console.log(`  ✓ ${j.name}: ${j.requirements.length} requirements`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
