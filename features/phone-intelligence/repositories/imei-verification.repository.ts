import "server-only";

import { prisma } from "@/lib/prisma";
import type { ImeiVerification } from "@/lib/generated/prisma/client";

export interface ImeiVerificationWrite {
  imei: string;
  ptaStatus: string;
  cpidStatus: string;
  isStolen: boolean;
  isBlacklisted: boolean;
  deviceModel: string | null;
  deviceBrand: string | null;
  deviceColor: string | null;
  verificationSource: string;
  isSimulated: boolean;
  verifiedBy: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export function findImeiVerification(imei: string): Promise<ImeiVerification | null> {
  return prisma.imeiVerification.findUnique({ where: { imei } });
}

export function findImeiVerificationById(id: string): Promise<ImeiVerification | null> {
  return prisma.imeiVerification.findUnique({ where: { id } });
}

/** Persists a fresh lookup, replacing the previous status for the same IMEI. */
export function saveImeiVerification(
  data: ImeiVerificationWrite,
): Promise<ImeiVerification> {
  const values = {
    ptaStatus: data.ptaStatus,
    cpidStatus: data.cpidStatus,
    isStolen: data.isStolen,
    isBlacklisted: data.isBlacklisted,
    deviceModel: data.deviceModel,
    deviceBrand: data.deviceBrand,
    deviceColor: data.deviceColor,
    verificationSource: data.verificationSource,
    isSimulated: data.isSimulated,
    verifiedAt: new Date(),
    verifiedBy: data.verifiedBy,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  };

  return prisma.imeiVerification.upsert({
    where: { imei: data.imei },
    update: values,
    create: { imei: data.imei, ...values },
  });
}

export function findUserImeiVerifications(userId: string, take = 20): Promise<ImeiVerification[]> {
  return prisma.imeiVerification.findMany({
    where: { verifiedBy: userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
