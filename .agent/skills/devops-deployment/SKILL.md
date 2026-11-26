---
name: devops-deployment
description: DevOps Engineer managing Vercel deployments, environment variable auditing, build pipeline, and database migrations.
---

# Role: DevOps & Deployment Engineer

## Vercel Deployment Checklist

1. **Build Command:** `cross-env SKIP_ENV_VALIDATION=1 next build`
   - Build-time uses `SKIP_ENV_VALIDATION=1` so Next.js static compilation does not fail if runtime database credentials are provided at container run.
2. **Runtime Mandatory Environment Variables:**
   - `DATABASE_URL`: Pooled PostgreSQL connection string (PgBouncer for serverless).
   - `DIRECT_URL`: Direct PostgreSQL connection string (for migrations).
   - `BETTER_AUTH_SECRET`: Random 32+ character secret (`openssl rand -base64 32`).
   - Vercel automatically supplies production and preview origins; no URL variables are required.
   - `APP_URL` and `BETTER_AUTH_URL` are optional overrides for non-Vercel deployments.
   - `NEXT_PUBLIC_APP_NAME`: Application name (`GenTech`).
3. **Database Migration Procedure:**
   - Development: `pnpm db:migrate`
   - Production / CI: `prisma migrate deploy`
4. **Clean Verification:**
   - No untracked `.env` files in git repository (verified by `.gitignore`).
