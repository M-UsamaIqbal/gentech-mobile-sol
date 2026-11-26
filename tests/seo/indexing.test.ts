import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockedEnv = vi.hoisted(() => ({
  env: { NODE_ENV: "test", NEXT_PUBLIC_APP_NAME: "GenTech" } as Record<string, unknown>,
}));

vi.mock("@/lib/env", () => ({ env: mockedEnv.env }));

import { middleware } from "@/middleware";

function robotsDirective(path: string): string | null {
  const response = middleware(new NextRequest(`https://gentech.example${path}`));
  return response.headers.get("x-robots-tag");
}

describe("SEO indexing headers", () => {
  it("blocks private localized and global routes", () => {
    expect(robotsDirective("/dashboard/messages/1")).toBe("noindex, nofollow");
    expect(robotsDirective("/pk/ur/dashboard/orders")).toBe("noindex, nofollow");
    expect(robotsDirective("/admin/orders")).toBe("noindex, nofollow");
    expect(robotsDirective("/bh/en/checkout")).toBe("noindex, nofollow");
    expect(robotsDirective("/sell")).toBe("noindex, nofollow");
  });

  it("keeps clean public pages indexable", () => {
    expect(robotsDirective("/pk/en/marketplace")).toBeNull();
    expect(robotsDirective("/bh/ar/listings/iphone-15")).toBeNull();
  });

  it("blocks filtered marketplace variants without blocking crawl following", () => {
    expect(robotsDirective("/pk/en/marketplace?q=iphone")).toBe("noindex, follow");
    expect(robotsDirective("/pk/en/marketplace?sort=price_desc")).toBe("noindex, follow");
    expect(robotsDirective("/pk/en/marketplace?page=2")).toBe("noindex, follow");
    expect(robotsDirective("/pk/en/marketplace?sort=recent&page=1")).toBeNull();
  });
});
