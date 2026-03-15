import { prisma } from "@/lib/prisma";
import { CaseStatus } from "@/generated/prisma";

// Valid status transitions. All business logic for what is allowed lives here.
const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  NEW: [CaseStatus.DOCS_REQUESTED, CaseStatus.DOCS_COMPLETE, CaseStatus.ON_HOLD],
  DOCS_REQUESTED: [CaseStatus.DOCS_COMPLETE, CaseStatus.ON_HOLD],
  DOCS_COMPLETE: [CaseStatus.SUBMITTED, CaseStatus.ON_HOLD],
  SUBMITTED: [
    CaseStatus.CORRECTIONS_REQUIRED,
    CaseStatus.APPROVED,
    CaseStatus.ON_HOLD,
  ],
  CORRECTIONS_REQUIRED: [CaseStatus.RESUBMITTED, CaseStatus.ON_HOLD],
  RESUBMITTED: [
    CaseStatus.CORRECTIONS_REQUIRED,
    CaseStatus.APPROVED,
    CaseStatus.ON_HOLD,
  ],
  APPROVED: [CaseStatus.READY_TO_START],
  READY_TO_START: [],
  ON_HOLD: [
    CaseStatus.NEW,
    CaseStatus.DOCS_REQUESTED,
    CaseStatus.DOCS_COMPLETE,
    CaseStatus.SUBMITTED,
    CaseStatus.CORRECTIONS_REQUIRED,
    CaseStatus.RESUBMITTED,
    CaseStatus.APPROVED,
  ],
};

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function transitionCaseStatus(
  caseId: string,
  toStatus: CaseStatus,
  changedBy: string | null,
  note?: string
) {
  const permitCase = await prisma.permitCase.findUnique({
    where: { id: caseId },
    select: { status: true, companyId: true },
  });

  if (!permitCase) throw new Error("Case not found");

  if (!canTransition(permitCase.status, toStatus)) {
    throw new Error(
      `Invalid transition: ${permitCase.status} → ${toStatus}`
    );
  }

  const [updated] = await prisma.$transaction([
    prisma.permitCase.update({
      where: { id: caseId },
      data: {
        status: toStatus,
        ...(toStatus === CaseStatus.SUBMITTED && { submittedAt: new Date() }),
        ...(toStatus === CaseStatus.APPROVED && { approvedAt: new Date() }),
      },
    }),
    prisma.statusHistory.create({
      data: {
        caseId,
        fromStatus: permitCase.status,
        toStatus,
        changedBy,
        note,
      },
    }),
  ]);

  return updated;
}

export async function getCaseWithDetails(caseId: string, companyId: string) {
  return prisma.permitCase.findFirst({
    where: { id: caseId, companyId },
    include: {
      jurisdiction: {
        include: { requirements: true },
      },
      documents: { orderBy: { createdAt: "asc" } },
      documentRequests: { orderBy: { sentAt: "desc" } },
      corrections: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getCasesForCompany(companyId: string) {
  return prisma.permitCase.findMany({
    where: { companyId },
    include: {
      jurisdiction: { select: { name: true, state: true } },
      corrections: { where: { resolved: false }, select: { id: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}
