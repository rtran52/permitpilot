/**
 * Auth-protected presign endpoint for office-side document uploads.
 * Unlike /api/upload/presign (homeowner flow), this requires a valid session
 * and a caseId that belongs to the user's company.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildFileKey,
  generatePresignedUploadUrl,
  getPublicUrl,
} from "@/lib/storage";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const user = await requireUser();
    const { caseId } = await params;
    const { filename, contentType, docType } = await req.json() as {
      filename: string;
      contentType: string;
      docType: string;
    };

    // Verify ownership
    const permitCase = await prisma.permitCase.findFirst({
      where: { id: caseId, companyId: user.companyId },
      select: { id: true },
    });
    if (!permitCase) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const fileKey = buildFileKey(caseId, docType, filename);
    const uploadUrl = await generatePresignedUploadUrl(
      fileKey,
      contentType || "application/octet-stream"
    );
    const publicUrl = getPublicUrl(fileKey);

    return NextResponse.json({ uploadUrl, fileKey, publicUrl });
  } catch (err) {
    console.error("office upload presign error:", err);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
