import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { transitionCaseStatus } from "@/lib/cases";
import { prisma } from "@/lib/prisma";
import { CaseStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const user = await requireUser();
    const { caseId } = await params;
    const body = await req.json();
    const { toStatus, note } = body as { toStatus: string; note?: string };

    // Validate that toStatus is a real CaseStatus
    if (!Object.values(CaseStatus).includes(toStatus as CaseStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verify case belongs to user's company
    const permitCase = await prisma.permitCase.findFirst({
      where: { id: caseId, companyId: user.companyId },
      select: { id: true },
    });
    if (!permitCase) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await transitionCaseStatus(
      caseId,
      toStatus as CaseStatus,
      user.id,
      note
    );

    return NextResponse.json({ status: updated.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isValidationError = message.startsWith("Invalid transition");
    return NextResponse.json(
      { error: message },
      { status: isValidationError ? 422 : 500 }
    );
  }
}
