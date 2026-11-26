import { describe, expect, it } from "vitest";

import { mobileNavKeyForPath } from "@/features/marketplace/lib/mobile-app-navigation";

describe("mobileNavKeyForPath", () => {
  it("maps localized and legacy home paths to the home tab", () => {
    expect(mobileNavKeyForPath("/pk/en")).toBe("home");
    expect(mobileNavKeyForPath("/bh/ur/")).toBe("home");
    expect(mobileNavKeyForPath("/")).toBe("home");
  });

  it("maps primary sections to their tabs", () => {
    expect(mobileNavKeyForPath("/pk/en/categories")).toBe("categories");
    expect(mobileNavKeyForPath("/bh/ar/sell")).toBe("sell");
    expect(mobileNavKeyForPath("/sell")).toBe("sell");
    expect(mobileNavKeyForPath("/bh/ar/dashboard/messages/123")).toBe("messages");
  });

  it("maps account areas to the account tab", () => {
    expect(mobileNavKeyForPath("/pk/ur/dashboard/favorites")).toBe("account");
    expect(mobileNavKeyForPath("/account/profile")).toBe("account");
    expect(mobileNavKeyForPath("/admin/users")).toBe("account");
    expect(mobileNavKeyForPath("/inspector/queue")).toBe("account");
    expect(mobileNavKeyForPath("/sign-in")).toBe("account");
  });

  it("falls back to home for unknown pages", () => {
    expect(mobileNavKeyForPath("/pk/en/marketplace")).toBe("home");
    expect(mobileNavKeyForPath("/inspection")).toBe("home");
  });
});
