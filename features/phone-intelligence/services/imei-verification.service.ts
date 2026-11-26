import "server-only";

import type { ImeiVerification } from "@/lib/generated/prisma/client";
import { getDeviceVerificationProvider } from "../providers";
import {
  findImeiVerification,
  findImeiVerificationById,
  findUserImeiVerifications,
  saveImeiVerification,
} from "../repositories/imei-verification.repository";
import {
  imeiVerificationResultSchema,
  type ImeiVerificationInput,
  type ImeiVerificationResult,
} from "../schemas/imei.schema";

/** Regulatory status can change (blocked/stolen), so cached lookups expire. */
export const IMEI_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function isStale(verification: ImeiVerification): boolean {
  if (!verification.verifiedAt) return true;
  return Date.now() - verification.verifiedAt.getTime() > IMEI_VERIFICATION_TTL_MS;
}

export class ImeiVerificationService {
  /**
   * Returns a fresh PTA/CPID lookup when a provider is available, otherwise the last
   * cached result (flagged stale). Returns `null` when nothing can be verified — the
   * caller must not invent an "approved" status.
   */
  async verifyImei(
    input: ImeiVerificationInput,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ImeiVerificationResult | null> {
    const cached = await findImeiVerification(input.imei);
    if (cached && !isStale(cached)) {
      return this.mapToResult(cached, false);
    }

    const provider = getDeviceVerificationProvider();
    if (!provider) {
      return cached ? this.mapToResult(cached, true) : null;
    }

    let lookup;
    try {
      lookup = await provider.verify(input.imei);
    } catch (error) {
      console.error("[imei-verification] provider lookup failed:", error);
      return cached ? this.mapToResult(cached, true) : null;
    }

    const saved = await saveImeiVerification({
      imei: input.imei,
      ptaStatus: lookup.ptaStatus,
      cpidStatus: lookup.cpidStatus,
      isStolen: lookup.isStolen,
      isBlacklisted: lookup.isBlacklisted,
      deviceModel: lookup.deviceModel,
      deviceBrand: lookup.deviceBrand,
      deviceColor: lookup.deviceColor,
      verificationSource: provider.simulated ? "SIMULATED" : "PTA",
      isSimulated: provider.simulated,
      verifiedBy: userId ?? null,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });

    return this.mapToResult(saved, false);
  }

  /** Cached lookup for rendering a result page; does not call a provider. */
  async getVerification(imei: string): Promise<ImeiVerificationResult | null> {
    const verification = await findImeiVerification(imei);
    return verification ? this.mapToResult(verification, isStale(verification)) : null;
  }

  async getVerificationById(id: string): Promise<ImeiVerificationResult | null> {
    const verification = await findImeiVerificationById(id);
    return verification ? this.mapToResult(verification, isStale(verification)) : null;
  }

  async getUserVerifications(userId: string) {
    return findUserImeiVerifications(userId);
  }

  private mapToResult(
    verification: ImeiVerification,
    stale: boolean,
  ): ImeiVerificationResult {
    return imeiVerificationResultSchema.parse({
      id: verification.id,
      imei: verification.imei,
      ptaStatus: verification.ptaStatus,
      cpidStatus: verification.cpidStatus,
      isStolen: verification.isStolen,
      isBlacklisted: verification.isBlacklisted,
      deviceModel: verification.deviceModel,
      deviceBrand: verification.deviceBrand,
      deviceColor: verification.deviceColor,
      verifiedAt: verification.verifiedAt,
      verificationSource: verification.verificationSource,
      isSimulated: verification.isSimulated,
      isStale: stale,
      lastCheckedAt: verification.updatedAt,
    });
  }
}

export const imeiVerificationService = new ImeiVerificationService();
