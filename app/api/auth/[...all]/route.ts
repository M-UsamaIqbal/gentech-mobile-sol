import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMIT_CONFIG } from "@/lib/rate-limit";

// Better Auth mounts all of its endpoints under /api/auth/*.
const baseHandler = toNextJsHandler(auth.handler);

async function rateLimitedHandler(request: NextRequest, method: keyof typeof baseHandler) {
  const pathname = new URL(request.url).pathname;

  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ipAddress = forwardedFor
    ? forwardedFor.split(",")[0]?.trim() ?? null
    : realIp?.trim() ?? null;

  let rateLimitType: keyof typeof RATE_LIMIT_CONFIG = "auth";
  if (pathname.includes("/forgot-password") || pathname.includes("/reset-password")) {
    rateLimitType = "passwordReset";
  }

  const identifier = getRateLimitIdentifier(ipAddress ?? "unknown");
  const rateLimitResult = checkRateLimit(identifier, rateLimitType);

  if (!rateLimitResult.allowed) {
    const resetDate = new Date(rateLimitResult.resetTime);
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);

    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(RATE_LIMIT_CONFIG[rateLimitType].requests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": resetDate.toISOString(),
        },
      },
    );
  }

  return baseHandler[method](request);
}

export const GET = (request: NextRequest) => rateLimitedHandler(request, "GET");
export const POST = (request: NextRequest) => rateLimitedHandler(request, "POST");
export const PATCH = (request: NextRequest) => rateLimitedHandler(request, "PATCH");
export const PUT = (request: NextRequest) => rateLimitedHandler(request, "PUT");
export const DELETE = (request: NextRequest) => rateLimitedHandler(request, "DELETE");
