import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { searchListingsForComparePicker } from "@/features/search/services/listing-search.service";
import { getCountryFromParam, getRegionForCountry } from "@/lib/countries/server";
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMIT_CONFIG } from "@/lib/rate-limit";

const querySchema = z.object({
  q: z.string().trim().min(2).max(100),
  country: z.string().trim().max(2).optional(),
  limit: z.coerce.number().int().min(1).max(12).catch(8),
});

/** Public listing picker endpoint: GET /api/v1/search/listings?q=...&country=PK */
export async function GET(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ipAddress = forwardedFor
    ? (forwardedFor.split(",")[0]?.trim() ?? null)
    : (realIp?.trim() ?? null);

  const rateLimit = checkRateLimit(
    getRateLimitIdentifier(ipAddress ?? "unknown"),
    "searchSuggestions",
  );
  const rateHeaders = {
    "X-RateLimit-Limit": String(RATE_LIMIT_CONFIG.searchSuggestions.requests),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": new Date(rateLimit.resetTime).toISOString(),
  };

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { items: [] },
      {
        status: 429,
        headers: {
          ...rateHeaders,
          "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
        },
      },
    );
  }

  const parsed = querySchema.safeParse({
    q: request.nextUrl.searchParams.get("q") ?? "",
    country: request.nextUrl.searchParams.get("country") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ items: [] }, { status: 400, headers: rateHeaders });
  }

  const region = getRegionForCountry(getCountryFromParam(parsed.data.country ?? ""));
  const items = await searchListingsForComparePicker(parsed.data.q, region, parsed.data.limit);

  return NextResponse.json(
    { items },
    { headers: { ...rateHeaders, "Cache-Control": "private, max-age=10" } },
  );
}
