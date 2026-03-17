/**
 * Demo data seed — creates 8 realistic permit cases covering every status
 * in the pipeline, ready for a live walkthrough.
 *
 * Usage:  npm run db:seed-demo
 *
 * Safe to re-run: deletes and recreates any case whose externalRef starts
 * with "DEMO-" so you can reset the demo state cleanly at any time.
 *
 * Prerequisites: npm run db:seed must have run first (jurisdictions required).
 */

import "dotenv/config";
import { PrismaClient, CaseStatus, TradeType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Placeholder file URL — shows the doc as "Received" in the UI.
// The link 404s but that's fine for a demo.
const DEMO_FILE_URL = "https://demo.permitpilot.app/sample-document.pdf";

function fileKey(caseId: string, docType: string) {
  return `cases/${caseId}/${docType}/demo-doc.pdf`;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function main() {
  // ── Preflight ─────────────────────────────────────────────────────────────

  const company = await prisma.company.findFirst();
  if (!company) {
    throw new Error(
      'No company found. Run "npm run db:seed" first to create the company and jurisdictions.'
    );
  }

  const allJurisdictions = await prisma.jurisdiction.findMany({
    include: { requirements: { where: { trade: TradeType.ROOFING } } },
    orderBy: { name: "asc" },
  });

  function jurisdiction(name: string) {
    const j = allJurisdictions.find((j) => j.name === name);
    if (!j) {
      throw new Error(
        `Jurisdiction "${name}" not found. Run "npm run db:seed" first.`
      );
    }
    return j;
  }

  function requiredDocs(j: (typeof allJurisdictions)[number]) {
    return j.requirements.filter((r) => r.required);
  }

  // ── Clean up existing demo data ───────────────────────────────────────────

  const existing = await prisma.permitCase.findMany({
    where: { companyId: company.id, externalRef: { startsWith: "DEMO-" } },
    select: { id: true },
  });
  const existingIds = existing.map((c) => c.id);

  if (existingIds.length > 0) {
    // Delete children before parent (no cascade in schema)
    await prisma.correctionNote.deleteMany({ where: { caseId: { in: existingIds } } });
    await prisma.document.deleteMany({ where: { caseId: { in: existingIds } } });
    await prisma.documentRequest.deleteMany({ where: { caseId: { in: existingIds } } });
    await prisma.statusHistory.deleteMany({ where: { caseId: { in: existingIds } } });
    await prisma.permitCase.deleteMany({ where: { id: { in: existingIds } } });
    console.log(`  · Reset ${existingIds.length} existing demo case(s)`);
  }

  console.log("Seeding demo cases...\n");

  // =========================================================================
  // Case 1 — "The Fresh Open"
  // Status: NEW · 0 docs · Hillsborough County
  // Purpose: create this live during the demo to show case creation + batch request
  // =========================================================================

  const j1 = jurisdiction("Hillsborough County");
  const c1 = await prisma.permitCase.create({
    data: {
      address: "4821 Cypress Hill Dr",
      city: "Tampa",
      state: "FL",
      zip: "33624",
      trade: TradeType.ROOFING,
      homeownerName: "Maria Santos",
      homeownerPhone: "(813) 555-0142",
      homeownerEmail: "maria.santos@email.com",
      externalRef: "DEMO-RR-2024-0891",
      jurisdictionId: j1.id,
      status: CaseStatus.NEW,
      companyId: company.id,
      createdAt: daysAgo(2),
    },
  });
  await prisma.statusHistory.create({
    data: {
      caseId: c1.id,
      fromStatus: null,
      toStatus: CaseStatus.NEW,
      note: "Case created",
      createdAt: daysAgo(2),
    },
  });
  console.log("  ✓ Case 1 — The Fresh Open (New, 0 docs, Hillsborough)");

  // =========================================================================
  // Case 2 — "Waiting on Homeowner"
  // Status: DOCS_REQUESTED · 3 of 7 docs received · 2 requested · Pinellas
  // Purpose: shows a realistic in-progress doc collection state
  // Note: updatedAt set 6 days ago → appears in dashboard "Needs Attention"
  // =========================================================================

  const j2 = jurisdiction("Pinellas County");
  const j2Reqs = requiredDocs(j2);

  const c2 = await prisma.permitCase.create({
    data: {
      address: "1103 Bayside Terrace",
      city: "Clearwater",
      state: "FL",
      zip: "33755",
      trade: TradeType.ROOFING,
      homeownerName: "James Whitfield",
      homeownerPhone: "(727) 555-0209",
      externalRef: "DEMO-RR-2024-0876",
      jurisdictionId: j2.id,
      status: CaseStatus.DOCS_REQUESTED,
      notes: "Waiting on signed NOC — homeowner is out of town until next week.",
      companyId: company.id,
      createdAt: daysAgo(12),
      updatedAt: daysAgo(6), // stale → Needs Attention
    },
  });
  await prisma.statusHistory.createMany({
    data: [
      {
        caseId: c2.id,
        fromStatus: null,
        toStatus: CaseStatus.NEW,
        note: "Case created",
        createdAt: daysAgo(12),
      },
      {
        caseId: c2.id,
        fromStatus: CaseStatus.NEW,
        toStatus: CaseStatus.DOCS_REQUESTED,
        note: "Document requested: Signed Contract",
        createdAt: daysAgo(6),
      },
    ],
  });
  // 3 docs received
  for (const req of j2Reqs.slice(0, 3)) {
    await prisma.document.create({
      data: {
        caseId: c2.id,
        docType: req.docType,
        label: req.label,
        fileKey: fileKey(c2.id, req.docType),
        fileUrl: DEMO_FILE_URL,
        uploadedBy: "HOMEOWNER",
        createdAt: daysAgo(8),
      },
    });
  }
  // 2 docs requested (amber clock in checklist)
  for (const req of j2Reqs.slice(3, 5)) {
    await prisma.documentRequest.create({
      data: {
        caseId: c2.id,
        token: `demo-c2-${req.docType.toLowerCase().replace(/_/g, "-")}`,
        docType: req.docType,
        label: req.label,
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
        sentAt: daysAgo(6),
      },
    });
  }
  console.log("  ✓ Case 2 — Waiting on Homeowner (Docs Requested, 3/7 received, Pinellas)");

  // =========================================================================
  // Case 3 — "Ready to Submit"
  // Status: DOCS_COMPLETE · all 6 required docs received · Sarasota
  // Purpose: shows a case the office has everything for and is ready to submit
  // =========================================================================

  const j3 = jurisdiction("Sarasota County");
  const c3 = await prisma.permitCase.create({
    data: {
      address: "7750 Mango Ave",
      city: "Sarasota",
      state: "FL",
      zip: "34231",
      trade: TradeType.ROOFING,
      homeownerName: "David Okonkwo",
      homeownerPhone: "(941) 555-0317",
      externalRef: "DEMO-RR-2024-0854",
      jurisdictionId: j3.id,
      status: CaseStatus.DOCS_COMPLETE,
      notes: "Packet ready. Submitting Thursday.",
      companyId: company.id,
      createdAt: daysAgo(10),
    },
  });
  await prisma.statusHistory.createMany({
    data: [
      { caseId: c3.id, fromStatus: null, toStatus: CaseStatus.NEW, note: "Case created", createdAt: daysAgo(10) },
      { caseId: c3.id, fromStatus: CaseStatus.NEW, toStatus: CaseStatus.DOCS_REQUESTED, note: "Document requested: Signed Contract", createdAt: daysAgo(8) },
      { caseId: c3.id, fromStatus: CaseStatus.DOCS_REQUESTED, toStatus: CaseStatus.DOCS_COMPLETE, note: "All documents received", createdAt: daysAgo(1) },
    ],
  });
  for (const req of requiredDocs(j3)) {
    await prisma.document.create({
      data: {
        caseId: c3.id,
        docType: req.docType,
        label: req.label,
        fileKey: fileKey(c3.id, req.docType),
        fileUrl: DEMO_FILE_URL,
        uploadedBy: "HOMEOWNER",
        createdAt: daysAgo(3),
      },
    });
  }
  console.log("  ✓ Case 3 — Ready to Submit (Docs Complete, all docs received, Sarasota)");

  // =========================================================================
  // Case 4 — "At the Permit Office"
  // Status: SUBMITTED · permit # COL-2024-18847 · Collier
  // Purpose: shows a submitted case with a real permit number recorded
  // =========================================================================

  const j4 = jurisdiction("Collier County");
  const c4 = await prisma.permitCase.create({
    data: {
      address: "2234 Pelican Bay Blvd",
      city: "Naples",
      state: "FL",
      zip: "34108",
      trade: TradeType.ROOFING,
      homeownerName: "Susan Tremblay",
      homeownerPhone: "(239) 555-0448",
      externalRef: "DEMO-RR-2024-0831",
      jurisdictionId: j4.id,
      status: CaseStatus.SUBMITTED,
      permitNumber: "COL-2024-18847",
      submittedAt: daysAgo(7),
      notes: "Submitted 3/10. Avg turnaround is 8–10 business days.",
      companyId: company.id,
      createdAt: daysAgo(18),
    },
  });
  await prisma.statusHistory.createMany({
    data: [
      { caseId: c4.id, fromStatus: null, toStatus: CaseStatus.NEW, note: "Case created", createdAt: daysAgo(18) },
      { caseId: c4.id, fromStatus: CaseStatus.NEW, toStatus: CaseStatus.DOCS_REQUESTED, createdAt: daysAgo(15) },
      { caseId: c4.id, fromStatus: CaseStatus.DOCS_REQUESTED, toStatus: CaseStatus.DOCS_COMPLETE, createdAt: daysAgo(9) },
      { caseId: c4.id, fromStatus: CaseStatus.DOCS_COMPLETE, toStatus: CaseStatus.SUBMITTED, note: "Submitted to Collier County. Permit # COL-2024-18847", createdAt: daysAgo(7) },
    ],
  });
  for (const req of requiredDocs(j4)) {
    await prisma.document.create({
      data: {
        caseId: c4.id,
        docType: req.docType,
        label: req.label,
        fileKey: fileKey(c4.id, req.docType),
        fileUrl: DEMO_FILE_URL,
        uploadedBy: "HOMEOWNER",
        createdAt: daysAgo(11),
      },
    });
  }
  console.log("  ✓ Case 4 — At the Permit Office (Submitted, COL-2024-18847, Collier)");

  // =========================================================================
  // Case 5 — "Correction in Progress"
  // Status: CORRECTIONS_REQUIRED · 1 open + 1 resolved · Miami-Dade
  // Purpose: the best demo moment — show resolve → all clear → advance status
  // Note: updatedAt set 8 days ago → appears in "Needs Attention"
  //       Miami-Dade has 8 required docs (includes Scope of Work + NOA)
  // =========================================================================

  const j5 = jurisdiction("Miami-Dade County");
  const c5 = await prisma.permitCase.create({
    data: {
      address: "518 Brickell Key Dr",
      city: "Miami",
      state: "FL",
      zip: "33131",
      trade: TradeType.ROOFING,
      homeownerName: "Roberto Fuentes",
      homeownerPhone: "(305) 555-0561",
      externalRef: "DEMO-RR-2024-0807",
      jurisdictionId: j5.id,
      status: CaseStatus.CORRECTIONS_REQUIRED,
      permitNumber: "MDC-2024-77341",
      submittedAt: daysAgo(21),
      companyId: company.id,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(8), // stale → Needs Attention
    },
  });
  await prisma.statusHistory.createMany({
    data: [
      { caseId: c5.id, fromStatus: null, toStatus: CaseStatus.NEW, note: "Case created", createdAt: daysAgo(30) },
      { caseId: c5.id, fromStatus: CaseStatus.NEW, toStatus: CaseStatus.DOCS_REQUESTED, createdAt: daysAgo(28) },
      { caseId: c5.id, fromStatus: CaseStatus.DOCS_REQUESTED, toStatus: CaseStatus.DOCS_COMPLETE, createdAt: daysAgo(25) },
      { caseId: c5.id, fromStatus: CaseStatus.DOCS_COMPLETE, toStatus: CaseStatus.SUBMITTED, note: "Submitted to Miami-Dade. Permit # MDC-2024-77341", createdAt: daysAgo(21) },
      { caseId: c5.id, fromStatus: CaseStatus.SUBMITTED, toStatus: CaseStatus.CORRECTIONS_REQUIRED, note: "Corrections received from Miami-Dade permit office", createdAt: daysAgo(8) },
    ],
  });
  for (const req of requiredDocs(j5)) {
    await prisma.document.create({
      data: {
        caseId: c5.id,
        docType: req.docType,
        label: req.label,
        fileKey: fileKey(c5.id, req.docType),
        fileUrl: DEMO_FILE_URL,
        uploadedBy: "HOMEOWNER",
        createdAt: daysAgo(26),
      },
    });
  }
  // Open correction — leave unresolved for the live demo moment
  await prisma.correctionNote.create({
    data: {
      caseId: c5.id,
      content:
        "Product approval for underlayment does not match the installed product listed on the permit application. Resubmit with updated product approval sheet for Titanium PSU-30.",
      resolved: false,
      createdAt: daysAgo(8),
    },
  });
  // Resolved correction — already done, shows in the Resolved section
  await prisma.correctionNote.create({
    data: {
      caseId: c5.id,
      content: "Contractor license number missing from page 2 of the permit application.",
      resolved: true,
      resolvedAt: daysAgo(6),
      createdAt: daysAgo(8),
    },
  });
  console.log("  ✓ Case 5 — Correction in Progress (Corrections Required, 1 open + 1 resolved, Miami-Dade)");

  // =========================================================================
  // Case 6 — "Approved and Scheduling"
  // Status: READY_TO_START · permit # ORA-2024-55219 · Orange
  // Purpose: shows the finish line — permit in hand, job scheduling
  // =========================================================================

  const j6 = jurisdiction("Orange County");
  const c6 = await prisma.permitCase.create({
    data: {
      address: "9901 Orange Blossom Trail",
      city: "Orlando",
      state: "FL",
      zip: "32837",
      trade: TradeType.ROOFING,
      homeownerName: "Patricia Huang",
      homeownerPhone: "(407) 555-0673",
      externalRef: "DEMO-RR-2024-0789",
      jurisdictionId: j6.id,
      status: CaseStatus.READY_TO_START,
      permitNumber: "ORA-2024-55219",
      submittedAt: daysAgo(35),
      approvedAt: daysAgo(9),
      notes: "Approved 3/8. Scheduling crew week of 3/24.",
      companyId: company.id,
      createdAt: daysAgo(45),
    },
  });
  await prisma.statusHistory.createMany({
    data: [
      { caseId: c6.id, fromStatus: null, toStatus: CaseStatus.NEW, note: "Case created", createdAt: daysAgo(45) },
      { caseId: c6.id, fromStatus: CaseStatus.NEW, toStatus: CaseStatus.DOCS_REQUESTED, createdAt: daysAgo(42) },
      { caseId: c6.id, fromStatus: CaseStatus.DOCS_REQUESTED, toStatus: CaseStatus.DOCS_COMPLETE, createdAt: daysAgo(38) },
      { caseId: c6.id, fromStatus: CaseStatus.DOCS_COMPLETE, toStatus: CaseStatus.SUBMITTED, note: "Submitted to Orange County. Permit # ORA-2024-55219", createdAt: daysAgo(35) },
      { caseId: c6.id, fromStatus: CaseStatus.SUBMITTED, toStatus: CaseStatus.APPROVED, note: "Permit approved by Orange County", createdAt: daysAgo(9) },
      { caseId: c6.id, fromStatus: CaseStatus.APPROVED, toStatus: CaseStatus.READY_TO_START, note: "Permit in hand. Scheduling team notified.", createdAt: daysAgo(7) },
    ],
  });
  for (const req of requiredDocs(j6)) {
    await prisma.document.create({
      data: {
        caseId: c6.id,
        docType: req.docType,
        label: req.label,
        fileKey: fileKey(c6.id, req.docType),
        fileUrl: DEMO_FILE_URL,
        uploadedBy: "HOMEOWNER",
        createdAt: daysAgo(40),
      },
    });
  }
  console.log("  ✓ Case 6 — Approved and Scheduling (Ready to Start, ORA-2024-55219, Orange)");

  // =========================================================================
  // Case 7 — "On Hold"
  // Status: ON_HOLD · prior status DOCS_COMPLETE · Pinellas
  // Purpose: shows hold + restore — the restore hint will say "Docs Complete"
  // =========================================================================

  const j7 = jurisdiction("Pinellas County");
  const c7 = await prisma.permitCase.create({
    data: {
      address: "3345 Gandy Blvd",
      city: "St. Petersburg",
      state: "FL",
      zip: "33702",
      trade: TradeType.ROOFING,
      homeownerName: "Michael Ostrowski",
      homeownerPhone: "(727) 555-0784",
      externalRef: "DEMO-RR-2024-0762",
      jurisdictionId: j7.id,
      status: CaseStatus.ON_HOLD,
      companyId: company.id,
      createdAt: daysAgo(20),
    },
  });
  await prisma.statusHistory.createMany({
    data: [
      { caseId: c7.id, fromStatus: null, toStatus: CaseStatus.NEW, note: "Case created", createdAt: daysAgo(20) },
      { caseId: c7.id, fromStatus: CaseStatus.NEW, toStatus: CaseStatus.DOCS_REQUESTED, note: "Document requested: Signed Contract", createdAt: daysAgo(18) },
      { caseId: c7.id, fromStatus: CaseStatus.DOCS_REQUESTED, toStatus: CaseStatus.DOCS_COMPLETE, note: "All documents received", createdAt: daysAgo(12) },
      {
        caseId: c7.id,
        fromStatus: CaseStatus.DOCS_COMPLETE,
        toStatus: CaseStatus.ON_HOLD,
        // This note becomes the hold reason banner on the case detail page
        note: "Homeowner financing fell through — job paused pending resolution.",
        createdAt: daysAgo(4),
      },
    ],
  });
  for (const req of requiredDocs(j7)) {
    await prisma.document.create({
      data: {
        caseId: c7.id,
        docType: req.docType,
        label: req.label,
        fileKey: fileKey(c7.id, req.docType),
        fileUrl: DEMO_FILE_URL,
        uploadedBy: "HOMEOWNER",
        createdAt: daysAgo(15),
      },
    });
  }
  console.log("  ✓ Case 7 — On Hold (prior: Docs Complete → restore hint shows correctly, Pinellas)");

  // =========================================================================
  // Case 8 — "Recently Approved"
  // Status: APPROVED · permit # MAN-2024-29103 · Manatee
  // Purpose: populates the "Recently Approved" dashboard card
  // =========================================================================

  const j8 = jurisdiction("Manatee County");
  const c8 = await prisma.permitCase.create({
    data: {
      address: "6610 Osprey Ridge Ln",
      city: "Bradenton",
      state: "FL",
      zip: "34203",
      trade: TradeType.ROOFING,
      homeownerName: "Theresa Kowalski",
      homeownerPhone: "(941) 555-0895",
      externalRef: "DEMO-RR-2024-0748",
      jurisdictionId: j8.id,
      status: CaseStatus.APPROVED,
      permitNumber: "MAN-2024-29103",
      submittedAt: daysAgo(18),
      approvedAt: daysAgo(2),
      companyId: company.id,
      createdAt: daysAgo(25),
    },
  });
  await prisma.statusHistory.createMany({
    data: [
      { caseId: c8.id, fromStatus: null, toStatus: CaseStatus.NEW, note: "Case created", createdAt: daysAgo(25) },
      { caseId: c8.id, fromStatus: CaseStatus.NEW, toStatus: CaseStatus.DOCS_REQUESTED, createdAt: daysAgo(23) },
      { caseId: c8.id, fromStatus: CaseStatus.DOCS_REQUESTED, toStatus: CaseStatus.DOCS_COMPLETE, createdAt: daysAgo(21) },
      { caseId: c8.id, fromStatus: CaseStatus.DOCS_COMPLETE, toStatus: CaseStatus.SUBMITTED, note: "Submitted to Manatee County. Permit # MAN-2024-29103", createdAt: daysAgo(18) },
      { caseId: c8.id, fromStatus: CaseStatus.SUBMITTED, toStatus: CaseStatus.APPROVED, note: "Permit approved by Manatee County", createdAt: daysAgo(2) },
    ],
  });
  for (const req of requiredDocs(j8)) {
    await prisma.document.create({
      data: {
        caseId: c8.id,
        docType: req.docType,
        label: req.label,
        fileKey: fileKey(c8.id, req.docType),
        fileUrl: DEMO_FILE_URL,
        uploadedBy: "HOMEOWNER",
        createdAt: daysAgo(22),
      },
    });
  }
  console.log("  ✓ Case 8 — Recently Approved (Approved, MAN-2024-29103, Manatee)");

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Demo data ready. Open the app and you will see:

  Dashboard
    Active Permits   8 cases
    Needs Attention  Case 2 (stale, Docs Requested)
                     Case 5 (stale, Corrections Required)
    Recently Approved Case 8 (Manatee)

  Demo flow
    Case 1  → create live / show batch request
    Case 2  → show partial doc collection state
    Case 3  → advance to Submitted live (add permit #)
    Case 5  → resolve open correction → all clear → resubmit
    Case 7  → show On Hold + restore (hint: Docs Complete)

  Re-run at any time to reset:
    npm run db:seed-demo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
