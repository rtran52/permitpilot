import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import type { User } from "@prisma/client";

const isDev = process.env.NODE_ENV === "development";

function devLog(msg: string) {
  if (isDev) console.log(`[auth] ${msg}`);
}

/**
 * Returns the current User record from the DB, or null if not authenticated.
 *
 * If Clerk says the user is authenticated but no local DB row exists yet
 * (e.g. the webhook hasn't fired in local dev), this function provisions
 * the row on the spot using Clerk's server-side API.
 *
 * If no Company row exists yet (e.g. seed not run), one is created automatically
 * so local development works without manual setup steps.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth();

  if (!userId) {
    devLog("auth() returned no userId — user is not signed in to Clerk");
    return null;
  }

  devLog(`auth() userId: ${userId}`);

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) {
    devLog(`found existing DB user: ${existing.email}`);
    return existing;
  }

  devLog("no DB user found — provisioning via Clerk API");

  // Fetch user details from Clerk
  let clerkUser;
  try {
    const client = await clerkClient();
    clerkUser = await client.users.getUser(userId);
    devLog(`clerk user fetched: ${clerkUser.id}`);
  } catch (err) {
    devLog(`clerkClient().users.getUser failed: ${String(err)}`);
    return null;
  }

  const email =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    "";

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    email;

  // Ensure a Company row exists. The seed should create one, but if it hasn't
  // been run yet we create a default so local dev doesn't require manual setup.
  let company = await prisma.company.findFirst();
  if (!company) {
    devLog("no Company found — creating default company");
    company = await prisma.company.create({ data: { name: "My Company" } });
  }

  devLog(`using company: ${company.id} (${company.name})`);

  const userCount = await prisma.user.count({ where: { companyId: company.id } });
  const role = userCount === 0 ? UserRole.OWNER : UserRole.OFFICE_MANAGER;

  devLog(`creating DB user with role: ${role}`);

  try {
    return await prisma.user.create({
      data: {
        clerkId: userId,
        email,
        name,
        role,
        companyId: company.id,
      },
    });
  } catch (err) {
    // Guard against a race condition where two requests both reach this
    // point simultaneously — the second create will hit a unique constraint.
    devLog(`user create failed (possible race): ${String(err)}`);
    return prisma.user.findUnique({ where: { clerkId: userId } });
  }
}

/**
 * Returns the current user, or redirects to /sign-in.
 * Safe to call from Server Components and Server Actions.
 * For Route Handlers, use requireUser() directly and return a 401 response.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}
