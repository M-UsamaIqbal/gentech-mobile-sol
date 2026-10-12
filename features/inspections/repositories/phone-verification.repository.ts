import "server-only";

import { prisma } from "@/lib/prisma";

/** Creates or refreshes the live code for a (user, phone), resetting attempts. */
export async function upsertPhoneVerification(input: {
  userId: string;
  phone: string;
  codeHash: string;
  channel: string;
  expiresAt: Date;
}): Promise<void> {
  await prisma.phoneVerification.upsert({
    where: { userId_phone: { userId: input.userId, phone: input.phone } },
    update: {
      codeHash: input.codeHash,
      channel: input.channel,
      expiresAt: input.expiresAt,
      attempts: 0,
      verified: false,
      verifiedAt: null,
    },
    create: {
      userId: input.userId,
      phone: input.phone,
      codeHash: input.codeHash,
      channel: input.channel,
      expiresAt: input.expiresAt,
    },
  });
}

export async function getPhoneVerification(userId: string, phone: string) {
  return prisma.phoneVerification.findUnique({
    where: { userId_phone: { userId, phone } },
  });
}

/** Records a failed check and returns the new attempt count. */
export async function incrementPhoneVerificationAttempts(id: string): Promise<number> {
  const row = await prisma.phoneVerification.update({
    where: { id },
    data: { attempts: { increment: 1 } },
    select: { attempts: true },
  });
  return row.attempts;
}

export async function markPhoneVerified(id: string, when: Date): Promise<void> {
  await prisma.phoneVerification.update({
    where: { id },
    data: { verified: true, verifiedAt: when },
  });
}

/** True when the (user, phone) is verified and that verification is still fresh. */
export async function isPhoneVerifiedSince(
  userId: string,
  phone: string,
  since: Date,
): Promise<boolean> {
  const row = await prisma.phoneVerification.findUnique({
    where: { userId_phone: { userId, phone } },
    select: { verified: true, verifiedAt: true },
  });
  return Boolean(row?.verified && row.verifiedAt && row.verifiedAt >= since);
}
