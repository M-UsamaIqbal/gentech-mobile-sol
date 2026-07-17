import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Type-safe, validated environment variables.
 *
 * Importing `env` anywhere guarantees the listed variables exist and are well-formed
 * at process boot — a missing/invalid value throws immediately instead of surfacing
 * as a confusing runtime error deep in a request.
 *
 * Conventions:
 * - `server`  : secrets, never sent to the browser.
 * - `client`  : must be prefixed with NEXT_PUBLIC_ and is safe to expose.
 * - Optional providers (OAuth, email) are `.optional()` so the app boots before they
 *   are configured; the relevant feature degrades gracefully when absent.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // --- Database (Neon PostgreSQL) ---
    // Pooled connection (PgBouncer) for the app; direct connection for migrations.
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DIRECT_URL: z.string().min(1).optional(),

    // --- Better Auth ---
    BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
    BETTER_AUTH_URL: z.url().optional(),
    // DEV-ONLY escape hatch: set to "true" to skip the email-verification gate when no
    // email provider is configured. Ignored in production (see lib/auth.ts).
    AUTH_SKIP_EMAIL_VERIFICATION: z.string().optional(),

    // --- Social OAuth (optional until configured) ---
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    FACEBOOK_CLIENT_ID: z.string().min(1).optional(),
    FACEBOOK_CLIENT_SECRET: z.string().min(1).optional(),

    // --- Transactional email (optional until configured) ---
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),

    // --- Cloudinary media (optional until configured) ---
    CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
    CLOUDINARY_API_KEY: z.string().min(1).optional(),
    CLOUDINARY_API_SECRET: z.string().min(1).optional(),

    // --- Payment aggregator (PayFast/Safepay — JazzCash + Easypaisa + cards) ---
    // Optional: when unset the app uses the built-in SANDBOX provider (no real
    // charges) so the whole payment flow is clickable in development.
    PAYFAST_MERCHANT_ID: z.string().min(1).optional(),
    PAYFAST_SECURED_KEY: z.string().min(1).optional(),
    PAYFAST_API_BASE: z.url().optional(),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
    NEXT_PUBLIC_APP_NAME: z.string().min(1).default("GenTech"),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1).optional(),

    // --- Analytics (optional; each provider loads only when its id is set) ---
    NEXT_PUBLIC_GTM_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_GA4_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_META_PIXEL_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_MIXPANEL_TOKEN: z.string().min(1).optional(),
  },

  /**
   * Next.js bundles client vars at build time, so they must be destructured
   * manually. Server vars are read from `process.env` automatically.
   */
  experimental__runtimeEnv: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
    NEXT_PUBLIC_GA4_ID: process.env.NEXT_PUBLIC_GA4_ID,
    NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    NEXT_PUBLIC_MIXPANEL_TOKEN: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
  },

  emptyStringAsUndefined: true,

  /**
   * Allow `pnpm build` / lint to run in CI without a populated env by setting
   * SKIP_ENV_VALIDATION=1. Never set this at runtime.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
