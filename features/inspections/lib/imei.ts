/**
 * Masks a report IMEI to its last four digits for anyone who is not the
 * requester, assigned inspector, or an admin. Preserves the original length so
 * layout/copy never implies a shorter identifier than the device actually has.
 */
export function maskReportImei(imei: string | null): string | null {
  if (!imei) return null;
  const value = imei.trim();
  // Never echo a short value in full — an IMEI is always 15 digits.
  if (value.length <= 4) return null;
  return "*".repeat(value.length - 4) + value.slice(-4);
}
