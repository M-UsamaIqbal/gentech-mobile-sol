import { describe, expect, it } from "vitest";

import { buildWhatsAppLink, normalizeWhatsAppNumber } from "@/features/messaging/lib/whatsapp";

describe("WhatsApp contact links", () => {
  it("normalizes Pakistan mobile numbers entered locally", () => {
    expect(normalizeWhatsAppNumber("0300 123 4567")).toBe("923001234567");
    expect(normalizeWhatsAppNumber("3001234567")).toBe("923001234567");
    expect(normalizeWhatsAppNumber("+92 300 1234567")).toBe("923001234567");
    expect(normalizeWhatsAppNumber("0092 300 1234567")).toBe("923001234567");
  });

  it("keeps valid international numbers and rejects invalid values", () => {
    expect(normalizeWhatsAppNumber("+1 (415) 555-2671")).toBe("14155552671");
    expect(normalizeWhatsAppNumber("not a phone number")).toBeNull();
    expect(normalizeWhatsAppNumber("123")).toBeNull();
  });

  it("builds an encoded WhatsApp link and omits unavailable numbers", () => {
    const link = buildWhatsAppLink("0300 123 4567", "Interested in: Phone & case");

    expect(link).toBe("https://wa.me/923001234567?text=Interested%20in%3A%20Phone%20%26%20case");
    expect(buildWhatsAppLink(undefined, "Hello")).toBeNull();
    expect(buildWhatsAppLink("invalid", "Hello")).toBeNull();
  });
});
