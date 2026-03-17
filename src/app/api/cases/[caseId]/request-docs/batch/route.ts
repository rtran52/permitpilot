/**
 * Batch document request: creates N DocumentRequest records and sends
 * ONE combined SMS to the homeowner listing all needed docs.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBatchDocumentRequestSms } from "@/lib/sms";
import { randomUUID } from "crypto";

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
    const { docs, homeownerPhone, homeownerName } = body as {
      docs: { docType: string; docLabel: string }[];
      homeownerPhone: string;
      homeownerName: string;
    };

    if (!docs?.length) {
      return NextResponse.json({ error: "No docs provided" }, { status: 400 });
    }

    const permitCase = await prisma.permitCase.findFirst({
      where: { id: caseId, companyId: user.companyId },
      select: { id: true, status: true },
    });
    if (!permitCase) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    // Create a DocumentRequest (with its own token) for each doc
    const created = await Promise.all(
      docs.map(async (doc) => {
        const token = randomUUID();
        await prisma.documentRequest.create({
          data: {
            caseId,
            token,
            docType: doc.docType,
            label: doc.docLabel,
            expiresAt,
          },
        });
        return { label: doc.docLabel, token };
      })
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    if (twilioConfigured()) {
      await sendBatchDocumentRequestSms({
        to: homeownerPhone,
        homeownerName,
        docs: created,
      });
    } else {
      console.log(
        "[dev] Batch upload links:\n" +
          created
            .map((d) => `  ${d.label}: ${appUrl}/upload/${d.token}`)
            .join("\n")
      );
    }

    // Auto-advance status if still NEW
    if (permitCase.status === "NEW") {
      await prisma.permitCase.update({
        where: { id: caseId },
        data: { status: "DOCS_REQUESTED" },
      });
      await prisma.statusHistory.create({
        data: {
          caseId,
          fromStatus: "NEW",
          toStatus: "DOCS_REQUESTED",
          changedBy: user.id,
          note: `Documents requested: ${docs.map((d) => d.docLabel).join(", ")}`,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      count: docs.length,
      ...(!twilioConfigured() && {
        uploadUrls: created.map((d) => ({
          label: d.label,
          url: `${appUrl}/upload/${d.token}`,
        })),
      }),
    });
  } catch (err) {
    console.error("batch request-docs error:", err);
    return NextResponse.json(
      { error: "Failed to send batch request" },
      { status: 500 }
    );
  }
}
