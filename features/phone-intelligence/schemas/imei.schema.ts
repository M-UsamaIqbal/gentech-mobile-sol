import { z } from 'zod';

export const imeiVerificationSchema = z.object({
  imei: z.string().regex(/^\d{15}$/, 'IMEI must be exactly 15 digits'),
});

export type ImeiVerificationInput = z.infer<typeof imeiVerificationSchema>;

export const imeiVerificationResultSchema = z.object({
  id: z.string(),
  imei: z.string(),
  ptaStatus: z.enum(['APPROVED', 'REJECTED', 'PENDING', 'UNKNOWN']).nullable(),
  cpidStatus: z.enum(['APPROVED', 'REJECTED', 'UNKNOWN']).nullable(),
  isStolen: z.boolean(),
  isBlacklisted: z.boolean(),
  deviceModel: z.string().nullable(),
  deviceBrand: z.string().nullable(),
  deviceColor: z.string().nullable(),
  verifiedAt: z.date().nullable(),
  verificationSource: z.enum(['PTA', 'CPID', 'SIMULATED', 'MANUAL']).nullable(),
  /** Result produced by the built-in simulator, not a real PTA/CPID lookup. */
  isSimulated: z.boolean().default(false),
  /** Cached result older than the freshness window; re-check was unavailable. */
  isStale: z.boolean().default(false),
  lastCheckedAt: z.date(),
});

export type ImeiVerificationResult = z.infer<typeof imeiVerificationResultSchema>;
