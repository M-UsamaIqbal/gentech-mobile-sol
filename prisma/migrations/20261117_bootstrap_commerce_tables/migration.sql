-- Bootstrap commerce tables that were present in the Prisma schema but missing
-- from the committed migration history. Safe to re-run on environments that
-- already contain these objects.

DO $$
BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "cart_item" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "price" DECIMAL(12,3) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'PKR',
  "region" "Region" NOT NULL DEFAULT 'PAKISTAN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cart_item_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cart_item_userId_listingId_key" UNIQUE ("userId", "listingId"),
  CONSTRAINT "cart_item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cart_item_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "cart_item_userId_idx" ON "cart_item"("userId");

CREATE TABLE IF NOT EXISTS "order" (
  "id" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "region" "Region" NOT NULL DEFAULT 'PAKISTAN',
  "currency" TEXT NOT NULL DEFAULT 'PKR',
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "subtotal" DECIMAL(12,3) NOT NULL,
  "shipping" DECIMAL(12,3) NOT NULL DEFAULT 0,
  "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
  "taxAmount" DECIMAL(12,3) NOT NULL DEFAULT 0,
  "taxName" TEXT,
  "discount" DECIMAL(12,3) NOT NULL DEFAULT 0,
  "total" DECIMAL(12,3) NOT NULL,
  "shippingMethod" TEXT,
  "estimatedDays" INTEGER,
  "deliveryAddress" JSONB,
  "paymentMethod" TEXT,
  "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
  "paymentRef" TEXT,
  "paidAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "order_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_orderNumber_key" UNIQUE ("orderNumber"),
  CONSTRAINT "order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "order_customerId_idx" ON "order"("customerId");
CREATE INDEX IF NOT EXISTS "order_customerId_createdAt_idx" ON "order"("customerId", "createdAt");
CREATE INDEX IF NOT EXISTS "order_region_idx" ON "order"("region");
CREATE INDEX IF NOT EXISTS "order_region_status_createdAt_idx" ON "order"("region", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "order_status_idx" ON "order"("status");
CREATE INDEX IF NOT EXISTS "order_createdAt_idx" ON "order"("createdAt");

CREATE TABLE IF NOT EXISTS "order_item" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "listingId" TEXT,
  "title" TEXT NOT NULL,
  "unitPrice" DECIMAL(12,3) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'PKR',
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "lineTotal" DECIMAL(12,3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_item_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_item_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "order_item_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "order_item_orderId_idx" ON "order_item"("orderId");
CREATE INDEX IF NOT EXISTS "order_item_listingId_idx" ON "order_item"("listingId");

CREATE TABLE IF NOT EXISTS "payment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "amount" DECIMAL(12,3) NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "providerReference" TEXT,
  "providerTransactionId" TEXT,
  "idempotencyKey" TEXT,
  "failureReason" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "refundedAt" TIMESTAMP(3),
  "refundAmount" DECIMAL(12,3),
  "refundReason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_idempotencyKey_key" UNIQUE ("idempotencyKey"),
  CONSTRAINT "payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "payment_orderId_idx" ON "payment"("orderId");
CREATE INDEX IF NOT EXISTS "payment_orderId_createdAt_idx" ON "payment"("orderId", "createdAt");
CREATE INDEX IF NOT EXISTS "payment_provider_idx" ON "payment"("provider");
CREATE INDEX IF NOT EXISTS "payment_status_idx" ON "payment"("status");
CREATE INDEX IF NOT EXISTS "payment_country_idx" ON "payment"("country");
