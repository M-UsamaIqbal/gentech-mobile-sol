import { describe, expect, it } from "vitest";

import { getDefaultLocale } from "@/lib/countries";
import type { CountryCode, LocaleCode } from "@/lib/countries/types";
import {
  parseAcceptLanguage,
  resolveCountry,
  resolveLocale,
  resolveLocalization,
} from "@/lib/localization/detect";

interface ScenarioInput {
  geo?: string;
  browser?: string;
  countryCookie?: string;
  localeCookie?: string;
  userCountry?: string;
  userLocale?: string;
  explicitCountry?: CountryCode;
  explicitLocale?: LocaleCode;
}

function detect(input: ScenarioInput) {
  return resolveLocalization(
    {
      country: {
        explicit: input.explicitCountry,
        user: input.userCountry,
        cookie: input.countryCookie,
        geo: input.geo,
      },
      locale: {
        explicit: input.explicitLocale,
        user: input.userLocale,
        cookie: input.localeCookie,
        acceptLanguage: input.browser,
      },
    },
    getDefaultLocale,
  );
}

describe("localization detection", () => {
  describe("Accept-Language parsing", () => {
    it("normalises regional subtags and respects quality weights", () => {
      expect(parseAcceptLanguage("en-US,en;q=0.9,ar-BH;q=0.8,ur;q=0.7")).toEqual([
        "en",
        "ar",
        "ur",
      ]);
    });

    it("ignores unsupported languages and q=0 entries", () => {
      expect(parseAcceptLanguage("fr-FR,ur-PK;q=0.9,en;q=0")).toEqual(["ur"]);
    });
  });

  describe("independent priority chains", () => {
    it("never derives country from browser language", () => {
      const result = detect({ browser: "ar-BH,ar;q=0.9" });
      expect(result.country).toBe("PK");
      expect(result.locale).toBe("ar");
    });

    it("keeps explicit locale ahead of saved and browser preferences", () => {
      const result = detect({
        geo: "BH",
        browser: "ar",
        localeCookie: "ur",
        userLocale: "ar",
        explicitLocale: "en",
      });
      expect(result.locale).toBe("en");
      expect(result.localeSource).toBe("explicit");
    });

    it("puts the authenticated preference before anonymous cookies and browser hints", () => {
      const result = detect({
        geo: "PK",
        countryCookie: "PK",
        localeCookie: "en",
        userCountry: "BH",
        userLocale: "ur",
        browser: "ar",
      });
      expect(result).toMatchObject({ country: "BH", locale: "ur" });
      expect(result.countrySource).toBe("user");
      expect(result.localeSource).toBe("user");
    });
  });

  describe("requested test combinations", () => {
    const cases: Array<{
      name: string;
      input: ScenarioInput;
      country: CountryCode;
      locale: LocaleCode;
    }> = [
      { name: "1. Bahrain + English browser", input: { geo: "BH", browser: "en-US,en;q=0.9" }, country: "BH", locale: "en" },
      { name: "2. Bahrain + Arabic browser", input: { geo: "BH", browser: "ar" }, country: "BH", locale: "ar" },
      { name: "3. Bahrain + Urdu browser", input: { geo: "BH", browser: "ur-PK" }, country: "BH", locale: "ur" },
      { name: "4. Pakistan + English browser", input: { geo: "PK", browser: "en" }, country: "PK", locale: "en" },
      { name: "5. Pakistan + Urdu browser", input: { geo: "PK", browser: "ur" }, country: "PK", locale: "ur" },
      { name: "6. Pakistan + Arabic browser", input: { geo: "PK", browser: "ar" }, country: "PK", locale: "ar" },
      {
        name: "7. Bahrain + manual English with Arabic browser",
        input: { geo: "BH", browser: "ar", localeCookie: "en" },
        country: "BH",
        locale: "en",
      },
      {
        name: "8. Pakistan + manual Urdu with English browser",
        input: { geo: "PK", browser: "en", userLocale: "ur" },
        country: "PK",
        locale: "ur",
      },
      {
        name: "9. Returning visitor restores saved country and language",
        input: { geo: "PK", browser: "ar", countryCookie: "BH", localeCookie: "en" },
        country: "BH",
        locale: "en",
      },
      {
        name: "10. Logged-in account preferences beat automatic detection",
        input: {
          geo: "PK",
          browser: "en",
          countryCookie: "PK",
          userCountry: "BH",
          userLocale: "ar",
        },
        country: "BH",
        locale: "ar",
      },
    ];

    for (const testCase of cases) {
      it(testCase.name, () => {
        const result = detect(testCase.input);
        expect(result.country).toBe(testCase.country);
        expect(result.locale).toBe(testCase.locale);
      });
    }
  });

  it("falls back to the country default, then global English", () => {
    expect(resolveCountry({ geo: "ZZ" }).country).toBe("PK");
    expect(resolveLocale({}, "BH", getDefaultLocale("BH")).locale).toBe("ar");
    expect(resolveLocale({}, "PK", getDefaultLocale("PK")).locale).toBe("ur");
    expect(resolveLocale({}, "BH", undefined as unknown as LocaleCode).locale).toBe("en");
  });
});
