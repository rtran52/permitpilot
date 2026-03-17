/**
 * Records an office-side document upload after the file has been PUT to R2.
 * Creates (or replaces) the Document record for this case + docType.
 */
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
    const { fileKey, publicUrl, docType, docLabel } = await req.json() as {
      fileKey: string;
      publicUrl: string;
      docType: string;
      docLabel: string;
    };

    // Verify ownership
    const permitCase = await prisma.permitCase.findFirst({
      where: { id: caseId, companyId: user.companyId },
      select: { id: true },
    });
    if (!permitCase) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // If there is already a document for this docType on this case, replace it
    await prisma.document.deleteMany({ where: { caseId, docType } });

    await prisma.document.create({
      data: {
        caseId,
        docType,
        label: docLabel,
        fileKey,
        fileUrl: publicUrl,
        uploadedBy: user.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("office upload complete error:", err);
    return NextResponse.json(
      { error: "Failed to record upload" },
      { status: 500 }
    );
  }
}
