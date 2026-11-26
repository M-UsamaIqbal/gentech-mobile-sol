import "server-only";

import { Role } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

/**
 * Promotes the first persisted account to ADMIN when no active administrator
 * exists. Called from Better Auth's `user.create.after` hook so the advisory
 * lock serialises both the admin count and the promotion update.
 */
export async function assignInitialAdminIfNeeded(userId: string): Promise<Role> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('gentech-initial-admin'))`;

    const adminCount = await tx.user.count({
      where: { role: Role.ADMIN, deletedAt: null },
    });
    if (adminCount > 0) return Role.USER;

    await tx.user.update({
      where: { id: userId },
      data: { role: Role.ADMIN },
    });
    return Role.ADMIN;
  });
}
