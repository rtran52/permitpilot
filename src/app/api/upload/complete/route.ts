/**
 * Called by the homeowner upload form after the file is uploaded to R2.
 * Creates the Document record and marks the DocumentRequest as completed.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { token, fileKey, publicUrl, filename } = await req.json() as {
      token: string;
      fileKey: string;
      publicUrl: string;
      filename: string;
    };

    const request = await prisma.documentRequest.findUnique({
      where: { token },
    });

    if (!request || request.completedAt || request.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.document.create({
        data: {
          caseId: request.caseId,
          docType: request.docType,
          label: request.label,
          fileKey,
          fileUrl: publicUrl,
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
