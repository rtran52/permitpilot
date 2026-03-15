import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma";

/**
 * Returns the current User record from the DB, or null if not authenticated.
 * Use this in Server Components and Route Handlers.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;

  return prisma.user.findUnique({ where: { clerkId: userId } });
}

/**
 * Returns the current user or throws a 401-style error.
 * Use in Route Handlers that require authentication.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
