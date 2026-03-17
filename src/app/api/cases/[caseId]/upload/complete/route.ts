/**
 * Records an office-side document upload after the file has been PUT to R2.
 * Creates (or replaces) the Document record for this case + docType.
 *
 * Security: validates the client-supplied fileKey against the caseId from the
 * URL (already ownership-checked) and the docType from the request body.
 * publicUrl is re-derived server-side.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPublicUrl } from "@/lib/storage";

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

    // Validate fileKey belongs to this case and docType.
    const expectedPrefix = `cases/${caseId}/${docType}/`;
    if (!fileKey || !fileKey.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: "Invalid file key" }, { status: 400 });
    }

    // Derive publicUrl server-side; ignore the client-supplied value.
    const safePublicUrl = getPublicUrl(fileKey);

    // If there is already a document for this docType on this case, replace it
    await prisma.document.deleteMany({ where: { caseId, docType } });

    await prisma.document.create({
      data: {
        caseId,
        docType,
        label: docLabel,
        fileKey,
        fileUrl: safePublicUrl,
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
