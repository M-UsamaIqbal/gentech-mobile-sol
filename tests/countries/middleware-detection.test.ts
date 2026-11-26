import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

import { COUNTRY_HEADER, LOCALE_HEADER } from "@/lib/countries/types";

const mockedEnv = vi.hoisted(() => ({
  env: { NODE_ENV: "test", NEXT_PUBLIC_APP_NAME: "GenTech" } as Record<string, unknown>,
}));

vi.mock("@/lib/env", () => ({ env: mockedEnv.env }));

import { middleware } from "@/middleware";

function makeRequest(options: {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  path?: string;
} = {}) {
  const request = new NextRequest(`https://gentech.example${options.path ?? "/"}`, {
    headers: options.headers ?? {},
  });
  for (const [name, value] of Object.entries(options.cookies ?? {})) {
    request.cookies.set(name, value);
  }
  return request;
}

function redirectedPath(path: string, options: Parameters<typeof makeRequest>[0] = {}) {
  const response = middleware(makeRequest({ ...options, path }));
  return {
    status: response.status,
    location: response.headers.get("location") ?? "",
    country: response.headers.get(COUNTRY_HEADER),
    locale: response.headers.get(LOCALE_HEADER),
  };
}

describe("Country and locale routing middleware", () => {
  it("uses Vercel's country header then falls back to Cloudflare", () => {
    expect(redirectedPath("/", { headers: { "x-vercel-ip-country": "BH" } }).location).toContain(
      "/bh/ar",
    );
    expect(redirectedPath("/", { headers: { "cf-ipcountry": "BH" } }).location).toContain("/bh/ar");
  });

  it("keeps query parameters when redirecting a public route", () => {
    const request = makeRequest({
      path: "/marketplace?q=iphone&sort=price",
      headers: { "x-vercel-ip-country": "BH" },
    });
    const response = middleware(request);
    expect(response.headers.get("location")).toContain("/bh/ar/marketplace?q=iphone&sort=price");
    expect(response.headers.get("vary")).toContain("Accept-Language");
    expect(response.headers.get("vary")).toContain("Cookie");
  });

  it("falls back to the default country for unknown geo headers", () => {
    expect(redirectedPath("/", { headers: { "x-vercel-ip-country": "ZZ" } }).location).toContain(
      "/pk/ur",
    );
  });

  describe("requested combinations 1–10", () => {
    const cases: Array<{
      name: string;
      options: Parameters<typeof makeRequest>[0];
      expected: string;
    }> = [
      {
        name: "1. Bahrain + English browser → English + BHD",
        options: { headers: { "x-vercel-ip-country": "BH", "accept-language": "en-US,en;q=0.9" } },
        expected: "/bh/en",
      },
      {
        name: "2. Bahrain + Arabic browser → Arabic + BHD",
        options: { headers: { "x-vercel-ip-country": "BH", "accept-language": "ar" } },
        expected: "/bh/ar",
      },
      {
        name: "3. Bahrain + Urdu browser → Urdu + BHD",
        options: { headers: { "x-vercel-ip-country": "BH", "accept-language": "ur-PK" } },
        expected: "/bh/ur",
      },
      {
        name: "4. Pakistan + English browser → English + PKR",
        options: { headers: { "x-vercel-ip-country": "PK", "accept-language": "en" } },
        expected: "/pk/en",
      },
      {
        name: "5. Pakistan + Urdu browser → Urdu + PKR",
        options: { headers: { "x-vercel-ip-country": "PK", "accept-language": "ur" } },
        expected: "/pk/ur",
      },
      {
        name: "6. Pakistan + Arabic browser → Arabic + PKR",
        options: { headers: { "x-vercel-ip-country": "PK", "accept-language": "ar" } },
        expected: "/pk/ar",
      },
      {
        name: "7. Manual English beats Arabic browser",
        options: {
          headers: { "x-vercel-ip-country": "BH", "accept-language": "ar" },
          cookies: { gentech_country: "BH", gentech_locale: "en" },
        },
        expected: "/bh/en",
      },
      {
        name: "8. Manual Urdu beats English browser",
        options: {
          headers: { "x-vercel-ip-country": "PK", "accept-language": "en" },
          cookies: { gentech_locale: "ur" },
        },
        expected: "/pk/ur",
      },
      {
        name: "9. Returning visitor country and language restored",
        options: {
          headers: { "x-vercel-ip-country": "PK", "accept-language": "ar" },
          cookies: { gentech_country: "BH", gentech_locale: "en" },
        },
        expected: "/bh/en",
      },
      {
        name: "10. Logged-in preferences beat geo and browser language",
        options: {
          headers: { "x-vercel-ip-country": "PK", "accept-language": "en" },
          cookies: {
            gentech_country: "PK",
            gentech_locale: "en",
            gentech_user_country: "BH",
            gentech_user_locale: "ar",
          },
        },
        expected: "/bh/ar",
      },
    ];

    for (const testCase of cases) {
      it(testCase.name, () => {
        const result = redirectedPath("/", testCase.options);
        expect(result.status).toBe(307);
        expect(result.location).toContain(testCase.expected);
      });
    }
  });

  it("accepts every language in every country without locale normalisation", () => {
    for (const path of ["/bh/ur/marketplace", "/pk/ar/marketplace", "/bh/en", "/pk/en"]) {
      const response = middleware(makeRequest({ path }));
      // A 200 pass-through means the URL was not redirected to a country default.
      expect(response.status).toBe(200);
    }
  });

  it("resolves a language for a country-only URL without changing the country", () => {
    const result = redirectedPath("/bh/marketplace", {
      headers: { "accept-language": "en" },
      cookies: { gentech_country: "PK" },
    });
    expect(result.location).toContain("/bh/en/marketplace");
  });
});
