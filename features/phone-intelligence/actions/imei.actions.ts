'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/session';
import {
  checkRateLimit,
  getRateLimitIdentifier,
} from '@/lib/rate-limit';
import { imeiVerificationService } from '../services/imei-verification.service';
import { imeiVerificationSchema } from '../schemas/imei.schema';

const IMEI_CHECK_PATH = '/imei-check';

export async function verifyImeiAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const headersList = await headers();

  const ipAddress =
    (headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip')) ??
    undefined;
  const userAgent = headersList.get('user-agent') ?? undefined;

  const rateLimit = checkRateLimit(
    `imei:${getRateLimitIdentifier(ipAddress, user?.id)}`,
    'imeiCheck',
  );
  if (!rateLimit.allowed) {
    redirect(`${IMEI_CHECK_PATH}?rateLimited=1`);
  }

  const parsed = imeiVerificationSchema.safeParse({ imei: formData.get('imei') });
  if (!parsed.success) {
    redirect(`${IMEI_CHECK_PATH}?invalid=1`);
  }

  const verification = await imeiVerificationService.verifyImei(
    parsed.data,
    user?.id,
    ipAddress,
    userAgent,
  );

  const params = new URLSearchParams({ imei: parsed.data.imei });
  if (!verification) params.set('unavailable', '1');
  redirect(`${IMEI_CHECK_PATH}?${params.toString()}`);
}

export async function getImeiVerificationAction(imei: string) {
  return imeiVerificationService.getVerification(imei);
}

export async function getUserImeiVerificationsAction() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  return imeiVerificationService.getUserVerifications(user.id);
}
