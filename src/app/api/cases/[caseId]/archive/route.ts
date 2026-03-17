import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const user = await requireUser();
    const { caseId } = await params;
    const { archived } = (await req.json()) as { archived: boolean };

    // Verify ownership
    const permitCase = await prisma.permitCase.findFirst({
      where: { id: caseId, companyId: user.companyId },
      select: { id: true },
    });
    if (!permitCase) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.permitCase.update({
      where: { id: caseId },
      data: {
        archived,
        archivedAt: archived ? new Date() : null,
      },
    });

    return NextResponse.json({ ok: true, archived });
  } catch (err) {
    console.error("archive route error:", err);
    return NextResponse.json({ error: "Failed to update archive state" }, { status: 500 });
  }
}
