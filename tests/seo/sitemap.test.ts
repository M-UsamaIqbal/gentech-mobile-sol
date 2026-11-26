import { describe, expect, it } from "vitest";

import { buildPublicSitemapEntries, buildListingSitemapEntries } from "@/lib/seo/sitemap";
import { buildRobotsConfig, isPrivateSeoPath, normalizeLocalizedPath } from "@/lib/seo/robots";

describe("sitemap and robots", () => {
  it("enumerates every public route in all six locales", () => {
    const entries = buildPublicSitemapEntries(
      "https://gentech.example",
      new Date("2026-11-18T00:00:00.000Z"),
    );

    expect(entries).toHaveLength(42);
    expect(entries.every((entry) => entry.url.startsWith("https://gentech.example/"))).toBe(true);
    expect(entries.map((entry) => entry.url)).toContain(
      "https://gentech.example/bh/ar/marketplace",
    );
    expect(entries.map((entry) => entry.url)).toContain("https://gentech.example/pk/en/inspection");
    expect(entries.map((entry) => entry.url)).not.toContain("https://gentech.example/dashboard");
  });

  it("adds active listings for each locale without duplicate URLs", () => {
    const entries = buildListingSitemapEntries("https://gentech.example/", [
      { slug: "iphone-15", country: "PK", lastModified: "2026-11-01T00:00:00.000Z" },
      { slug: "iphone-15", country: "PK" },
    ]);

    expect(entries).toHaveLength(3);
    expect(entries.map((entry) => entry.url)).toEqual([
      "https://gentech.example/pk/en/listings/iphone-15",
      "https://gentech.example/pk/ar/listings/iphone-15",
      "https://gentech.example/pk/ur/listings/iphone-15",
    ]);
    expect(entries[0]?.lastModified).toEqual(new Date("2026-11-01T00:00:00.000Z"));
  });

  it("blocks private surfaces while exposing the sitemap", () => {
    expect(normalizeLocalizedPath("/pk/ur/dashboard/orders")).toBe("/dashboard/orders");
    expect(isPrivateSeoPath("/pk/ur/dashboard/orders")).toBe(true);
    expect(isPrivateSeoPath("/admin/orders")).toBe(true);
    expect(isPrivateSeoPath("/bh/en/marketplace")).toBe(false);

    const config = buildRobotsConfig("https://gentech.example/");
    expect(config.sitemap).toBe("https://gentech.example/sitemap.xml");
    expect(config.rules).toMatchObject({
      userAgent: "*",
      allow: "/",
    });
    expect(config.rules).toMatchObject({
      disallow: expect.arrayContaining(["/dashboard", "/*/dashboard", "/admin", "/checkout"]),
    });
  });
});
