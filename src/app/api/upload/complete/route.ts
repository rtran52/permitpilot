/**
 * Called by the homeowner upload form after the file is uploaded to R2.
 * Creates the Document record and marks the DocumentRequest as completed.
 *
 * Security: this route is public (no Clerk session). We validate the
 * client-supplied fileKey against the server-known caseId + docType from the
 * DocumentRequest, and re-derive publicUrl server-side so neither can be
 * substituted by the client.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicUrl } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const { token, fileKey } = await req.json() as {
      token: string;
      fileKey: string;
    };

    const request = await prisma.documentRequest.findUnique({
      where: { token },
    });

    if (!request || request.completedAt || request.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // Validate fileKey belongs to this case and docType — prevents a client
    // from substituting a key from a different case or an external URL.
    const expectedPrefix = `cases/${request.caseId}/${request.docType}/`;
    if (!fileKey || !fileKey.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: "Invalid file key" }, { status: 400 });
    }

    // Derive publicUrl from the validated fileKey; never trust the client's value.
    const safePublicUrl = getPublicUrl(fileKey);

    await prisma.$transaction([
      prisma.document.create({
        data: {
          caseId: request.caseId,
          docType: request.docType,
          label: request.label,
          fileKey,
          fileUrl: safePublicUrl,
          uploadedBy: "HOMEOWNER",
        },
      }),
      prisma.documentRequest.update({
        where: { token },
        data: { completedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("upload complete error:", err);
    return NextResponse.json({ error: "Failed to record upload" }, { status: 500 });
  }
}
