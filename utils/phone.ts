/**
 * Phone number helpers. The marketplace is Pakistan-first, so local formats like
 * `0300-1234567` are normalized to E.164 (`+923001234567`) — the canonical form we
 * store OTP verifications against and hand to Twilio.
 */

/**
 * Normalizes a user-entered phone number to E.164, or returns `null` if it can't
 * be understood. Pakistani mobile shapes are recognised explicitly; any other
 * number already in `+<country><digits>` form is accepted as-is.
 *
 * Accepted PK inputs (spaces, dashes and parens are ignored):
 *   0300-1234567 · 03001234567 · 3001234567 · 923001234567 · +923001234567
 */
export function normalizePhone(raw: string): string | null {
  if (!raw) return null;

  // Keep a single leading "+" then digits only.
  const hasPlus = raw.trim().startsWith("+");
  let digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;

  // International access prefix "00" → "+".
  let plus = hasPlus;
  if (!plus && digits.startsWith("00")) {
    digits = digits.slice(2);
    plus = true;
  }

  // Pakistani local forms → +92XXXXXXXXXX.
  if (!plus) {
    if (digits.startsWith("0") && digits.length === 11) {
      // 03001234567 → 923001234567
      digits = `92${digits.slice(1)}`;
    } else if (digits.length === 10 && digits.startsWith("3")) {
      // 3001234567 → 923001234567
      digits = `92${digits}`;
    }
    // else: assume it's already a bare country-code number.
  }

  // A valid E.164 number is 8–15 digits.
  if (digits.length < 8 || digits.length > 15) return null;

  // Pakistani mobile sanity check: +92 followed by a 3XXXXXXXXX (10 digits).
  if (digits.startsWith("92") && !/^923\d{9}$/.test(digits)) return null;

  return `+${digits}`;
}

/** Masks a number for display/logs: `+923001234567` → `+92 300 ••• 4567`. */
export function maskPhone(e164: string): string {
  const m = e164.match(/^(\+\d{2})(\d{3})\d+(\d{4})$/);
  if (!m) return e164;
  return `${m[1]} ${m[2]} ••• ${m[3]}`;
}
