/**
 * CaseStatus values as a plain const — safe to import in both server and
 * client components. Identical string values to the Prisma enum so the
 * types are fully compatible with @prisma/client's CaseStatus type.
 */
export const CaseStatus = {
  NEW: "NEW",
  DOCS_REQUESTED: "DOCS_REQUESTED",
  DOCS_COMPLETE: "DOCS_COMPLETE",
  SUBMITTED: "SUBMITTED",
  CORRECTIONS_REQUIRED: "CORRECTIONS_REQUIRED",
  RESUBMITTED: "RESUBMITTED",
  APPROVED: "APPROVED",
  READY_TO_START: "READY_TO_START",
  ON_HOLD: "ON_HOLD",
} as const;

export type CaseStatus = (typeof CaseStatus)[keyof typeof CaseStatus];
