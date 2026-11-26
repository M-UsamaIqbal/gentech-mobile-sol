/** Shared validation for seller-supplied listing image URLs (safe in client and server bundles). */

export const MAX_IMAGE_URL_LENGTH = 2048;

/** Hosts the Next.js image optimizer is explicitly configured to fetch. */
const OPTIMIZABLE_HOSTS = new Set([
  "res.cloudinary.com",
  "lh3.googleusercontent.com",
  "platform-lookaside.fbsbx.com",
]);

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host.includes(":")) return true; // IPv6 literals are not supported
  if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/.test(host)) return true; // numeric IP encodings
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (/^(127|10|0)\./.test(host)) return true;
  if (/^192\.168\./.test(host) || /^169\.254\./.test(host)) return true;
  const private172 = host.match(/^172\.(\d+)\./);
  if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return true;
  return false;
}

export function parseImageUrl(value: string): URL | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_IMAGE_URL_LENGTH) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  if (isBlockedHost(url.hostname)) return null;
  return url;
}

export function isValidImageUrl(value: string): boolean {
  return parseImageUrl(value) !== null;
}

/** Splits a pasted block of image links (newline, comma or whitespace separated). */
export function parseImageUrls(value: string): string[] {
  return value
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * External image URLs bypass the server-side optimizer (which would otherwise
 * reject or proxy unconfigured hosts). Only allowlisted hosts use `next/image`
 * optimisation.
 */
export function isOptimizableImageUrl(value: string): boolean {
  const url = parseImageUrl(value);
  return url !== null && OPTIMIZABLE_HOSTS.has(url.hostname.toLowerCase());
}
