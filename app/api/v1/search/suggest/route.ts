import { NextResponse, type NextRequest } from "next/server";

import { getSearchSuggestions } from "@/features/search/services/suggestions.service";
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMIT_CONFIG } from "@/lib/rate-limit";

/** Public autocomplete endpoint: GET /api/v1/search/suggest?q=... */
export async function GET(request: NextRequest) {
  // Extract IP address for rate limiting
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ipAddress = forwardedFor 
    ? forwardedFor.split(",")[0]?.trim() ?? null
    : (realIp?.trim() ?? null);
  
  // Check rate limit for search suggestions
  const identifier = getRateLimitIdentifier(ipAddress ?? "unknown");
  const rateLimitResult = checkRateLimit(identifier, "searchSuggestions");
  
  if (!rateLimitResult.allowed) {
    const resetDate = new Date(rateLimitResult.resetTime);
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(RATE_LIMIT_CONFIG.searchSuggestions.requests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(resetDate.toISOString()),
        },
      },
    );
  }
  
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const suggestions = await getSearchSuggestions(q);
  
  const response = NextResponse.json(suggestions, {
    headers: { 
      "Cache-Control": "public, max-age=30",
      "X-RateLimit-Limit": String(RATE_LIMIT_CONFIG.searchSuggestions.requests),
      "X-RateLimit-Remaining": String(rateLimitResult.remaining),
      "X-RateLimit-Reset": String(new Date(rateLimitResult.resetTime).toISOString()),
    },
  });
  
  return response;
}
