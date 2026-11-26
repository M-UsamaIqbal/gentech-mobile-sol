export function normalizeWhatsAppNumber(value: string): string | null {
  let digits = value.trim().replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = `92${digits.slice(1)}`;
  } else if (digits.length === 10 && digits.startsWith("3")) {
    digits = `92${digits}`;
  }

  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

export function buildWhatsAppLink(phone: string | undefined, message: string): string | null {
  if (!phone) return null;
  const number = normalizeWhatsAppNumber(phone);
  if (!number) return null;

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
