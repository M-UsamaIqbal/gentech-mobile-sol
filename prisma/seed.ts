/**
 * Database seed — catalog **reference data only**.
 *
 * Seeds the phone-focused category tree, popular brands, inspection packages, and
 * the Sell-Your-Phone price book (models, deduction rules, grade multipliers).
 * Idempotent: safe to run repeatedly (everything upserts by unique key).
 *
 * It deliberately seeds NO sample listings, users, or inspection reports — the
 * marketplace shows only real, user-created content. Accounts go through Better
 * Auth's sign-up flow so passwords hash correctly.
 *
 * Run via `pnpm db:seed` or automatically after `pnpm db:migrate`.
 */
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../lib/generated/prisma/client";

// Prisma 7 no longer auto-loads .env; load it for standalone `pnpm db:seed` runs.
try {
  process.loadEnvFile();
} catch {
  // Ignore — env vars may already be present in the ambient environment.
}

/** Category tree: each root may declare children. */
const CATEGORIES: Array<{
  name: string;
  slug: string;
  icon?: string;
  children?: Array<{ name: string; slug: string }>;
}> = [
  {
    name: "Mobile Phones",
    slug: "mobile-phones",
    icon: "smartphone",
    children: [
      { name: "Smartphones", slug: "smartphones" },
      { name: "Feature Phones", slug: "feature-phones" },
      { name: "Tablets", slug: "tablets" },
      { name: "Smart Watches", slug: "smart-watches" },
    ],
  },
  {
    name: "Accessories",
    slug: "accessories",
    icon: "cable",
    children: [
      { name: "Chargers & Cables", slug: "chargers-cables" },
      { name: "Cases & Covers", slug: "cases-covers" },
      { name: "Power Banks", slug: "power-banks" },
      { name: "Earphones & Headphones", slug: "earphones-headphones" },
    ],
  },
];

const BRANDS = [
  "Apple",
  "Samsung",
  "Xiaomi",
  "Oppo",
  "Vivo",
  "Realme",
  "Infinix",
  "Tecno",
  "OnePlus",
  "Google",
  "Nokia",
  "Huawei",
  "Motorola",
];

/** Inspection packages (PakWheels-style tiers). Prices in PKR. */
const INSPECTION_PLANS: Array<{
  name: string;
  slug: string;
  description: string;
  price: number;
  checkpoints: number;
  features: string[];
  position: number;
}> = [
  {
    name: "Basic Check",
    slug: "basic-check",
    description: "A quick physical verification for buyers who just need peace of mind.",
    price: 1499,
    checkpoints: 20,
    features: [
      "Screen & body condition",
      "Battery health reading",
      "IMEI & PTA verification",
      "Basic functionality test",
      "Summary report with photos",
    ],
    position: 0,
  },
  {
    name: "Comprehensive Inspection",
    slug: "comprehensive-inspection",
    description: "Our full 40+ point inspection covering every component, sensor and camera.",
    price: 2999,
    checkpoints: 40,
    features: [
      "Everything in Basic Check",
      "All cameras & sensors tested",
      "Wired & wireless charging",
      "Connectivity (Wi-Fi/BT/GPS/signal)",
      "iCloud / account-lock check",
      "Detailed graded report + verdict",
    ],
    position: 1,
  },
];

/**
 * Sell-Your-Phone price book. Prices are the grade-A PTA reference (PKR); other
 * PTA statuses are derived by `PTA_FACTORS`. Covers 10 popular Pakistani models.
 */
const PHONE_MODELS: Array<{
  brand: string;
  model: string;
  /** storage → grade-A PTA base price (PKR) */
  storages: Record<string, number>;
}> = [
  { brand: "Apple", model: "iPhone 11", storages: { "64GB": 85000, "128GB": 95000 } },
  { brand: "Apple", model: "iPhone 12", storages: { "64GB": 115000, "128GB": 125000 } },
  { brand: "Apple", model: "iPhone 13", storages: { "128GB": 165000, "256GB": 185000 } },
  { brand: "Apple", model: "iPhone 14", storages: { "128GB": 215000, "256GB": 240000 } },
  { brand: "Apple", model: "iPhone 15", storages: { "128GB": 255000, "256GB": 285000 } },
  { brand: "Samsung", model: "Galaxy A54", storages: { "128GB": 72000, "256GB": 80000 } },
  { brand: "Samsung", model: "Galaxy S23", storages: { "256GB": 165000 } },
  { brand: "Infinix", model: "Note 40", storages: { "256GB": 42000 } },
  { brand: "Tecno", model: "Camon 30", storages: { "256GB": 46000 } },
  { brand: "Xiaomi", model: "Redmi Note 13", storages: { "128GB": 38000, "256GB": 44000 } },
];

/** Base-price multiplier per PTA status (PTA is the reference). */
const PTA_FACTORS: Record<string, number> = { PTA: 1, NON_PTA: 0.82, PATCHED: 0.78, JV: 0.9 };
/** Patched/JV only make sense for iPhones in this market. */
const APPLE_ONLY_STATUSES = new Set(["PATCHED", "JV"]);

/** Admin-editable deductions. `key` must match features/quotes/lib/pricing.ts. */
const DEDUCTION_RULES: Array<{
  key: string;
  label: string;
  amountPkr?: number;
  percent?: number;
  position: number;
}> = [
  { key: "box_missing", label: "Box not available", amountPkr: 1500, position: 0 },
  { key: "charger_missing", label: "Charger not available", amountPkr: 1000, position: 1 },
  { key: "part_replaced_screen", label: "Screen replaced", percent: 12, position: 2 },
  { key: "part_replaced_back_panel", label: "Back panel replaced", amountPkr: 2500, position: 3 },
  { key: "part_replaced_battery", label: "Battery replaced", amountPkr: 3000, position: 4 },
  { key: "biometrics_faulty", label: "Face ID / fingerprint not working", percent: 10, position: 5 },
  { key: "display_lines", label: "Display has lines", percent: 15, position: 6 },
  { key: "display_dots", label: "Display has dots / dead pixels", amountPkr: 2000, position: 7 },
  { key: "display_shade", label: "Display shadow / discoloration", amountPkr: 1500, position: 8 },
  { key: "camera_issue", label: "Camera issue", percent: 8, position: 9 },
  { key: "water_damage", label: "Water damage", percent: 20, position: 10 },
  { key: "battery_health_low", label: "Battery health below 85%", amountPkr: 4000, position: 11 },
];

const GRADE_MULTIPLIERS: Array<{ key: string; value: number; label: string }> = [
  { key: "grade_multiplier_a", value: 1.0, label: "Grade A multiplier" },
  { key: "grade_multiplier_b", value: 0.88, label: "Grade B multiplier" },
  { key: "grade_multiplier_c", value: 0.75, label: "Grade C multiplier" },
];

function roundTo500(n: number): number {
  return Math.round(n / 500) * 500;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL (or DIRECT_URL) must be set to seed the database.");
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    // Categories (roots, then children referencing the root id).
    for (const [rootIndex, root] of CATEGORIES.entries()) {
      const parent = await prisma.category.upsert({
        where: { slug: root.slug },
        update: { name: root.name, icon: root.icon, position: rootIndex },
        create: { name: root.name, slug: root.slug, icon: root.icon, position: rootIndex },
      });

      for (const [childIndex, child] of (root.children ?? []).entries()) {
        await prisma.category.upsert({
          where: { slug: child.slug },
          update: { name: child.name, parentId: parent.id, position: childIndex },
          create: {
            name: child.name,
            slug: child.slug,
            parentId: parent.id,
            position: childIndex,
          },
        });
      }
    }

    // Brands.
    for (const [index, name] of BRANDS.entries()) {
      const slug = slugify(name);
      await prisma.brand.upsert({
        where: { slug },
        update: { name, position: index },
        create: { name, slug, position: index },
      });
    }

    // Inspection plans.
    for (const plan of INSPECTION_PLANS) {
      await prisma.inspectionPlan.upsert({
        where: { slug: plan.slug },
        update: {
          name: plan.name,
          description: plan.description,
          price: plan.price,
          checkpoints: plan.checkpoints,
          features: plan.features,
          position: plan.position,
        },
        create: {
          name: plan.name,
          slug: plan.slug,
          description: plan.description,
          price: plan.price,
          checkpoints: plan.checkpoints,
          features: plan.features,
          position: plan.position,
        },
      });
    }

    // Sell-Your-Phone price book (phone_model), one row per PTA status.
    for (const entry of PHONE_MODELS) {
      for (const [storage, ptaBase] of Object.entries(entry.storages)) {
        for (const [ptaStatus, factor] of Object.entries(PTA_FACTORS)) {
          if (APPLE_ONLY_STATUSES.has(ptaStatus) && entry.brand !== "Apple") continue;
          const basePricePkr = roundTo500(ptaBase * factor);
          await prisma.phoneModel.upsert({
            where: {
              brand_model_storage_ptaStatus: {
                brand: entry.brand,
                model: entry.model,
                storage,
                ptaStatus: ptaStatus as never,
              },
            },
            update: { basePricePkr, isActive: true },
            create: {
              brand: entry.brand,
              model: entry.model,
              storage,
              ptaStatus: ptaStatus as never,
              basePricePkr,
              isActive: true,
            },
          });
        }
      }
    }

    // Deduction rules (admin-editable).
    for (const rule of DEDUCTION_RULES) {
      await prisma.deductionRule.upsert({
        where: { key: rule.key },
        update: {
          label: rule.label,
          amountPkr: rule.amountPkr ?? null,
          percent: rule.percent ?? null,
          position: rule.position,
        },
        create: {
          key: rule.key,
          label: rule.label,
          amountPkr: rule.amountPkr ?? null,
          percent: rule.percent ?? null,
          position: rule.position,
        },
      });
    }

    // Grade multipliers (admin-editable QuoteSetting).
    for (const gm of GRADE_MULTIPLIERS) {
      await prisma.quoteSetting.upsert({
        where: { key: gm.key },
        update: { value: gm.value, label: gm.label },
        create: { key: gm.key, value: gm.value, label: gm.label },
      });
    }

    const [categoryCount, brandCount, planCount, phoneModelCount, deductionCount] =
      await Promise.all([
        prisma.category.count(),
        prisma.brand.count(),
        prisma.inspectionPlan.count(),
        prisma.phoneModel.count(),
        prisma.deductionRule.count(),
      ]);
    console.info(
      `✓ Seed complete — ${categoryCount} categories, ${brandCount} brands, ${planCount} inspection plans, ${phoneModelCount} phone-model prices, ${deductionCount} deduction rules. (No sample listings — real content only.)`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
