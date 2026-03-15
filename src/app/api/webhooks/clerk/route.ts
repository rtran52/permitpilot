/**
 * Clerk webhook: syncs new users to the DB and assigns them to the company.
 *
 * In MVP, all users are assigned to the single seeded company.
 * Set CLERK_WEBHOOK_SECRET in env and configure this endpoint in Clerk dashboard.
 */
import { Webhook } from "svix";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!WEBHOOK_SECRET) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let event: { type: string; data: Record<string, unknown> };
  try {
    event = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as typeof event;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "user.created") {
    const data = event.data;
    const clerkId = data.id as string;
    const email = (data.email_addresses as Array<{ email_address: string }>)[0]
      ?.email_address;
    const firstName = (data.first_name as string) ?? "";
    const lastName = (data.last_name as string) ?? "";
    const name = [firstName, lastName].filter(Boolean).join(" ") || email;

    // Find the single company — MVP assumes one company per deployment
    const company = await prisma.company.findFirst();
    if (!company) {
      return new Response("No company configured", { status: 500 });
    }

    // First user to sign up becomes OWNER, rest are OFFICE_MANAGER
    const userCount = await prisma.user.count({
      where: { companyId: company.id },
    });

    await prisma.user.upsert({
      where: { clerkId },
      update: {},
      create: {
        clerkId,
        email,
        name,
        role: userCount === 0 ? UserRole.OWNER : UserRole.OFFICE_MANAGER,
        companyId: company.id,
      },
    });
  }

  return new Response("OK", { status: 200 });
}
