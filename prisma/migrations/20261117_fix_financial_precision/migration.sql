-- Fix financial precision: change all monetary columns from Decimal(12,2) to Decimal(12,3)
-- to support BHD's 3 decimal places (fils).

-- Listing
ALTER TABLE "listing" ALTER COLUMN "price" TYPE DECIMAL(12,3);

-- InspectionPlan
ALTER TABLE "inspection_plan" ALTER COLUMN "price" TYPE DECIMAL(12,3);

-- InspectionRequest
ALTER TABLE "inspection_request" ALTER COLUMN "feeAmount" TYPE DECIMAL(12,3);

-- DealerInventory
ALTER TABLE "dealer_inventory" ALTER COLUMN "costPrice" TYPE DECIMAL(12,3);

-- PhoneModel
ALTER TABLE "phone_model" ALTER COLUMN "launchPrice" TYPE DECIMAL(12,3);

-- PhoneValuation
ALTER TABLE "phone_valuation" ALTER COLUMN "estimatedPriceMin" TYPE DECIMAL(12,3);
ALTER TABLE "phone_valuation" ALTER COLUMN "estimatedPriceMax" TYPE DECIMAL(12,3);
ALTER TABLE "phone_valuation" ALTER COLUMN "estimatedPriceAvg" TYPE DECIMAL(12,3);

-- PromotionPlan
ALTER TABLE "promotion_plan" ALTER COLUMN "price" TYPE DECIMAL(12,3);

-- PromotionPayment
ALTER TABLE "promotion_payment" ALTER COLUMN "amount" TYPE DECIMAL(12,3);

-- ShippingMethod
ALTER TABLE "shipping_method" ALTER COLUMN "price" TYPE DECIMAL(12,3);

-- DeliveryZone
ALTER TABLE "delivery_zone" ALTER COLUMN "surcharge" TYPE DECIMAL(12,3);

-- CartItem
ALTER TABLE "cart_item" ALTER COLUMN "price" TYPE DECIMAL(12,3);

-- Order
ALTER TABLE "order" ALTER COLUMN "subtotal" TYPE DECIMAL(12,3);
ALTER TABLE "order" ALTER COLUMN "shipping" TYPE DECIMAL(12,3);
ALTER TABLE "order" ALTER COLUMN "taxAmount" TYPE DECIMAL(12,3);
ALTER TABLE "order" ALTER COLUMN "discount" TYPE DECIMAL(12,3);
ALTER TABLE "order" ALTER COLUMN "total" TYPE DECIMAL(12,3);

-- OrderItem
ALTER TABLE "order_item" ALTER COLUMN "unitPrice" TYPE DECIMAL(12,3);
ALTER TABLE "order_item" ALTER COLUMN "lineTotal" TYPE DECIMAL(12,3);

-- Payment
ALTER TABLE "payment" ALTER COLUMN "amount" TYPE DECIMAL(12,3);
ALTER TABLE "payment" ALTER COLUMN "refundAmount" TYPE DECIMAL(12,3);