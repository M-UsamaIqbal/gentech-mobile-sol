const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

const COUNTRY_SEGMENTS: Readonly<Record<string, string>> = { BH: "BH", PK: "PK" };

function sanitizeReferrer(referrer: string): string | undefined {
  if (!referrer) return undefined;
  try {
    const url = new URL(referrer);
    return `${url.origin}${url.pathname}`;
  } catch {
    return referrer.split(/[?#]/, 1)[0] || undefined;
  }
}

export interface Attribution {
  page_path: string;
  referrer?: string;
  country?: string;
  language?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

/**
 * Builds a privacy-safe attribution context from the current URL. Only known UTM keys,
 * referrer, locale and country are forwarded — arbitrary query values (which may contain
 * emails or identifiers) are never copied into analytics payloads.
 */
export function collectAttribution(href: string, referrer: string, language?: string): Attribution {
  let url: URL;
  try {
    url = new URL(href, "http://analytics.local");
  } catch {
    return { page_path: (href || "/").split(/[?#]/, 1)[0] || "/" };
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const country = segments
    .map((segment) => COUNTRY_SEGMENTS[segment.toUpperCase()])
    .find((value): value is string => Boolean(value));

  const attribution: Attribution = { page_path: url.pathname };
  const trackedParams = new URLSearchParams();
  const safeReferrer = sanitizeReferrer(referrer);
  if (safeReferrer) attribution.referrer = safeReferrer;
  if (country) attribution.country = country;
  if (language) attribution.language = language;

  for (const key of UTM_KEYS) {
    const value = url.searchParams.get(key);
    if (value) {
      attribution[key] = value;
      trackedParams.set(key, value);
    }
  }

  const query = trackedParams.toString();
  if (query) attribution.page_path = `${url.pathname}?${query}`;

  return attribution;
}
