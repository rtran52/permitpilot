import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendDocumentRequestSms } from "@/lib/sms";
import { randomUUID } from "crypto";

// Twilio creds are always in the format AC... — treat anything else as unconfigured.
function twilioConfigured() {
  return process.env.TWILIO_ACCOUNT_SID?.startsWith("AC") ?? false;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const user = await requireUser();
    const { caseId } = await params;
    const body = await req.json();
    const { docType, docLabel, homeownerPhone, homeownerName } = body as {
      docType: string;
      docLabel: string;
      homeownerPhone: string;
      homeownerName: string;
    };

    // Verify case belongs to user's company
    const permitCase = await prisma.permitCase.findFirst({
      where: { id: caseId, companyId: user.companyId },
      select: { id: true, status: true },
    });
    if (!permitCase) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Create the document request record with a magic-link token
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    await prisma.documentRequest.create({
      data: { caseId, token, docType, label: docLabel, expiresAt },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const uploadUrl = `${appUrl}/upload/${token}`;

    if (twilioConfigured()) {
      // Production path: send SMS, don't expose the URL in the response.
      await sendDocumentRequestSms({ to: homeownerPhone, homeownerName, docLabel, token });
    } else {
      // Dev path: SMS is not configured. Log the link so it can be used manually.
      console.log(`[dev] Upload link for "${docLabel}" → ${uploadUrl}`);
    }

    // Advance case to DOCS_REQUESTED if still NEW
    if (permitCase.status === "NEW") {
      await prisma.permitCase.update({
        where: { id: caseId },
        data: { status: "DOCS_REQUESTED", updatedAt: new Date() },
      });
      await prisma.statusHistory.create({
        data: {
          caseId,
          fromStatus: "NEW",
          toStatus: "DOCS_REQUESTED",
          changedBy: user.id,
          note: `Document requested: ${docLabel}`,
        },
      });
    }

    // Return the upload URL only when Twilio is not configured so the UI
    // can surface it for manual sharing. In production this field is absent.
    return NextResponse.json({
      ok: true,
      ...(!twilioConfigured() && { uploadUrl }),
    });
  } catch (err) {
    console.error("request-docs error:", err);
    return NextResponse.json({ error: "Failed to send request" }, { status: 500 });
  }
}
