import "dotenv/config";
import { PrismaClient, TradeType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Real roofing permit document requirements for Florida jurisdictions.
// All logic is data-driven — adding a new county or trade means adding rows here,
// not changing application code.

const roofingDocs = (overrides: { docType: string; label: string; required: boolean }[] = []) => [
  { trade: TradeType.ROOFING, docType: "SIGNED_CONTRACT",        label: "Signed Contract",                            required: true  },
  { trade: TradeType.ROOFING, docType: "PERMIT_APPLICATION",     label: "Permit Application (Signed by Owner)",        required: true  },
  { trade: TradeType.ROOFING, docType: "NOTICE_OF_COMMENCEMENT", label: "Notice of Commencement (if job > $2,500)",    required: true  },
  { trade: TradeType.ROOFING, docType: "PRODUCT_APPROVAL",       label: "Florida Product Approval (roofing system)",  required: true  },
  { trade: TradeType.ROOFING, docType: "CONTRACTORS_LICENSE",    label: "Contractor's License Copy",                  required: true  },
  { trade: TradeType.ROOFING, docType: "PROOF_OF_INSURANCE",     label: "Proof of Liability Insurance",               required: true  },
  { trade: TradeType.ROOFING, docType: "HOA_APPROVAL",           label: "HOA Approval Letter",                        required: false },
  ...overrides.map((o) => ({ trade: TradeType.ROOFING, ...o })),
];

const jurisdictions = [
  // ── Tampa Bay ────────────────────────────────────────────────────────────
  { name: "Hillsborough County", state: "FL", requirements: roofingDocs() },
  { name: "Pinellas County",     state: "FL", requirements: roofingDocs([
      { docType: "SCOPE_OF_WORK", label: "Scope of Work", required: true },
    ]),
  },
  { name: "Pasco County",        state: "FL", requirements: roofingDocs() },
  { name: "Manatee County",      state: "FL", requirements: roofingDocs() },
  { name: "Sarasota County",     state: "FL", requirements: roofingDocs() },

  // ── Southwest FL ─────────────────────────────────────────────────────────
  { name: "Lee County",          state: "FL", requirements: roofingDocs([
      { docType: "SCOPE_OF_WORK", label: "Scope of Work", required: true },
    ]),
  },
  { name: "Collier County",      state: "FL", requirements: roofingDocs([
      { docType: "SCOPE_OF_WORK", label: "Scope of Work", required: true },
    ]),
  },

  // ── Central FL ───────────────────────────────────────────────────────────
  { name: "Orange County",       state: "FL", requirements: roofingDocs([
      { docType: "SCOPE_OF_WORK", label: "Scope of Work", required: false },
    ]),
  },
  { name: "Osceola County",      state: "FL", requirements: roofingDocs() },
  { name: "Brevard County",      state: "FL", requirements: roofingDocs() },
  { name: "Volusia County",      state: "FL", requirements: roofingDocs() },

  // ── Northeast FL ─────────────────────────────────────────────────────────
  { name: "Duval County",        state: "FL", requirements: roofingDocs([
      { docType: "SCOPE_OF_WORK", label: "Scope of Work", required: true },
    ]),
  },

  // ── South FL ─────────────────────────────────────────────────────────────
  { name: "Palm Beach County",   state: "FL", requirements: roofingDocs([
      { docType: "SCOPE_OF_WORK", label: "Scope of Work", required: true },
    ]),
  },
  { name: "Broward County",      state: "FL", requirements: roofingDocs([
      { docType: "SCOPE_OF_WORK", label: "Scope of Work", required: true },
    ]),
  },
  { name: "Miami-Dade County",   state: "FL", requirements: roofingDocs([
      { docType: "SCOPE_OF_WORK",      label: "Scope of Work",               required: true  },
      { docType: "PRODUCT_APPROVAL_2", label: "NOA (Miami-Dade Product Notice of Acceptance)", required: true },
    ]),
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
