import "server-only";

import { env } from "@/lib/env";

const DEFAULT_APP_URL = "http://localhost:3000";

const vercelHost =
  process.env.VERCEL_ENV === "production"
    ? (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL)
    : (process.env.VERCEL_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL);

export const IS_VERCEL_DEPLOYMENT = Boolean(vercelHost);

export const APP_URL = vercelHost ? `https://${vercelHost}` : (env.APP_URL ?? DEFAULT_APP_URL);
