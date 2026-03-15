/**
 * Returns a presigned R2 upload URL for a given token + filename.
 * Public route (no auth) — validated against the DocumentRequest token.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildFileKey, generatePresignedUploadUrl, getPublicUrl } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const { token, filename, contentType } = await req.json() as {
      token: string;
      filename: string;
      contentType: string;
    };

    const request = await prisma.documentRequest.findUnique({
      where: { token },
    });

    if (!request || request.completedAt || request.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const fileKey = buildFileKey(request.caseId, request.docType, filename);
    const uploadUrl = await generatePresignedUploadUrl(fileKey, contentType);
    const publicUrl = getPublicUrl(fileKey);

    // [dev] Print the presigned URL so we can verify checksum params are gone.
    if (process.env.NODE_ENV !== "production") {
      console.log("[dev] presigned PUT URL:", uploadUrl);
    }

    return NextResponse.json({ uploadUrl, fileKey, publicUrl });
  } catch (err) {
    console.error("presign error:", err);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
