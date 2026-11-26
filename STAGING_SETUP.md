# Staging Database Setup Guide

## Overview

This guide provides instructions for setting up a dedicated staging PostgreSQL database for the GenTech marketplace.

**Important:** Never use the production database for staging testing. Always maintain separate databases:

```
Production DB ≠ Staging DB ≠ Test DB
```

## Database Provider

The application is compatible with any PostgreSQL provider. The recommended options are:

1. **Neon PostgreSQL** (Recommended)
   - Serverless PostgreSQL
   - Built-in connection pooling
   - Free tier available
   - Compatible with Prisma

2. **Alternative Providers**
   - Supabase
   - Railway
   - AWS RDS
   - Heroku Postgres

## Staging Database Setup

### Step 1: Create Staging Database

**For Neon:**

1. Sign up at https://neon.tech
2. Create a new project named `gentech-staging`
3. Note the connection strings:
   - **Pooled connection** (for application): Use `?pgbouncer=true`
   - **Direct connection** (for migrations): Without `?pgbouncer=true`

**For other providers:**

Follow the provider's documentation to create a new PostgreSQL database instance.

### Step 2: Configure Environment Variables

Set the following environment variables in your staging environment:

```bash
# Application connection (pooled)
DATABASE_URL="postgresql://user:password@host:port/database?pgbouncer=true"

# Migration connection (direct)
DIRECT_URL="postgresql://user:password@host:port/database"
```

**Important:**
- Replace `user`, `password`, `host`, `port`, `database` with actual values
- Never commit these values to Git
- Use different credentials for staging and production

### Step 3: Run Migrations

Navigate to the project directory and run:

```bash
# Generate Prisma client
pnpm db:generate

# Apply committed migrations to the staging database
pnpm db:deploy
```

Use `pnpm db:migrate` only when creating a new migration during development. Vercel
builds seed catalog data automatically, so configure the intended staging database
connection before building. Migrations must be run separately before deployment.

**Expected output:**
```
Running migrations...
20250812120000_init_schema ... OK
20250812120001_add_dealer_system ... OK
20250812120002_add_phone_history ... OK
20250812120003_add_dealer_leads ... OK
20250812120004_add_promotion_system ... OK
```

### Step 4: Verify Schema

Run schema validation:

```bash
pnpm prisma validate
```

Expected output:
```
The schema at prisma/schema.prisma is valid 🚀
```

### Step 5: Seed Staging Data (Optional)

If the project has a seed script:

```bash
pnpm db:seed
```

Or manually create test accounts using Prisma Studio:

```bash
pnpm db:studio
```

## Required Test Data

For staging verification, create the following test accounts:

### Admin User
```sql
INSERT INTO "user" (id, name, email, role, emailVerified)
VALUES (
  'admin-test-id',
  'Staging Admin',
  'admin-staging@example.com',
  'ADMIN',
  NOW()
);
```

### Regular User
```sql
INSERT INTO "user" (id, name, email, role, emailVerified)
VALUES (
  'user-test-id',
  'Staging User',
  'user-staging@example.com',
  'USER',
  NOW()
);
```

### Seller
```sql
INSERT INTO "user" (id, name, email, role, emailVerified)
VALUES (
  'seller-test-id',
  'Staging Seller',
  'seller-staging@example.com',
  'USER',
  NOW()
);
```

### Dealer
```sql
INSERT INTO "dealer" (id, name, slug, status, plan)
VALUES (
  'dealer-test-id',
  'Staging Dealer',
  'staging-dealer',
  'ACTIVE',
  'BASIC'
);
```

### Promotion Plan
```sql
INSERT INTO "PromotionPlan" (id, name, placement, price, durationDays, isActive)
VALUES (
  'plan-test-id',
  'Staging Plan',
  'HOME_FEATURED',
  500,
  7,
  true
);
```

**Important:** Use obviously synthetic test data with "staging" in identifiers to avoid confusion with production data.

## Migration Best Practices

### DO:
- ✅ Use `prisma migrate deploy` for production/staging
- ✅ Test migrations on a copy of production data first
- ✅ Review migration SQL before applying
- ✅ Backup database before major migrations
- ✅ Use version-controlled migration files

### DO NOT:
- ❌ Use `prisma db push` for production/staging
- ❌ Manually modify the database schema outside migrations
- ❌ Delete migration history
- ❌ Reset production database
- ❌ Run destructive migrations without backup

## Migration Rollback

If a migration fails:

1. **Stop the deployment**
2. **Check the error message**
3. **Review the migration SQL**
4. **Fix the migration**
5. **Create a new migration** (do not modify existing migrations)
6. **Test on staging again**

## Database Connection Pooling

The application uses connection pooling for performance:

- **Application**: Uses pooled connection (`DATABASE_URL` with `?pgbouncer=true`)
- **Migrations**: Uses direct connection (`DIRECT_URL` without pooling)

This separation ensures:
- Better performance for application queries
- Reliable migration execution
- No conflicts between application and migration connections

## Staging Environment Variables

Full staging environment configuration:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:port/database"

# Authentication
BETTER_AUTH_SECRET="your-staging-secret-min-32-characters"

# Vercel Preview automatically provides the staging origin; URL variables are not needed.
# For a non-Vercel staging deployment, optionally set APP_URL and BETTER_AUTH_URL.

# Application
NEXT_PUBLIC_APP_NAME="GenTech Staging"
NODE_ENV="production"

# Optional: Cloudinary (if testing uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Optional: Email (if testing email flows)
RESEND_API_KEY="your-resend-key"
EMAIL_FROM="staging@gentech.example.com"
```

## Verification Checklist

After setting up staging database:

- [ ] Database created successfully
- [ ] `DATABASE_URL` configured with pooled connection
- [ ] `DIRECT_URL` configured with direct connection
- [ ] All migrations applied successfully
- [ ] Prisma schema validation passes
- [ ] Test accounts created (admin, user, seller, dealer)
- [ ] Can connect to database from application
- [ ] No connection errors in logs
- [ ] Seed data (if used) is clearly identified as staging

## Troubleshooting

### Connection Errors

**Error:** `connection refused`
- Check host and port in connection string
- Verify database is running
- Check firewall settings

**Error:** `authentication failed`
- Verify username and password
- Check database user permissions

### Migration Errors

**Error:** `relation already exists`
- Database may already have schema
- Check existing tables
- Consider using a fresh database

**Error:** `column does not exist`
- Migration may have failed partially
- Check migration history
- Create fix migration

### Performance Issues

**Symptom:** Slow queries
- Check connection pool settings
- Verify indexes exist
- Review query patterns

## Next Steps

After staging database is configured:

1. Deploy application to staging environment
2. Configure environment variables in deployment platform
3. Run migration on staging database
4. Verify database connectivity
5. Create test accounts
6. Begin runtime verification flows

See `DEPLOYMENT_CHECKLIST.md` for complete staging verification steps.
