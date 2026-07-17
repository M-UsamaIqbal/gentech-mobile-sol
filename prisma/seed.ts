/**
 * Database seed — catalog reference data.
 *
 * Seeds the phone-focused category tree and popular brands. Idempotent: safe to
 * run repeatedly (everything upserts by unique slug). User accounts are NOT seeded
 * here — they go through Better Auth's sign-up flow so passwords hash correctly.
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

/** Sample marketplace listings so the catalog looks populated for demos/testing. */
const SAMPLE_LISTINGS: Array<{
  title: string;
  slug: string;
  price: number;
  condition: "NEW" | "OPEN_BOX" | "USED" | "REFURBISHED" | "FOR_PARTS";
  city: string;
  brandSlug: string;
  categorySlug: string;
  isFeatured?: boolean;
  negotiable?: boolean;
  views?: number;
  ageDays: number;
}> = [
  { title: "iPhone 15 Pro Max 256GB — PTA Approved", slug: "iphone-15-pro-max-256gb", price: 419999, condition: "USED", city: "Karachi", brandSlug: "apple", categorySlug: "smartphones", isFeatured: true, negotiable: true, views: 1820, ageDays: 0 },
  { title: "Samsung Galaxy S24 Ultra 512GB", slug: "samsung-galaxy-s24-ultra-512gb", price: 359999, condition: "OPEN_BOX", city: "Lahore", brandSlug: "samsung", categorySlug: "smartphones", isFeatured: true, views: 1430, ageDays: 1 },
  { title: "Xiaomi 14 — Brand New, Sealed", slug: "xiaomi-14-sealed", price: 184999, condition: "NEW", city: "Islamabad", brandSlug: "xiaomi", categorySlug: "smartphones", isFeatured: true, negotiable: true, views: 980, ageDays: 2 },
  { title: "Google Pixel 8 Pro 128GB", slug: "google-pixel-8-pro-128gb", price: 224999, condition: "USED", city: "Rawalpindi", brandSlug: "google", categorySlug: "smartphones", isFeatured: true, views: 1120, ageDays: 3 },
  { title: "Oppo Reno 11F 5G — Mint Condition", slug: "oppo-reno-11f-5g", price: 74999, condition: "USED", city: "Faisalabad", brandSlug: "oppo", categorySlug: "smartphones", negotiable: true, views: 640, ageDays: 1 },
  { title: "Apple Watch Series 9 45mm", slug: "apple-watch-series-9-45mm", price: 119999, condition: "OPEN_BOX", city: "Karachi", brandSlug: "apple", categorySlug: "smart-watches", views: 410, ageDays: 4 },
  { title: "Infinix Note 40 Pro — Refurbished", slug: "infinix-note-40-pro", price: 48999, condition: "REFURBISHED", city: "Multan", brandSlug: "infinix", categorySlug: "smartphones", negotiable: true, views: 305, ageDays: 5 },
  { title: "Realme GT 6 12GB/256GB", slug: "realme-gt-6", price: 134999, condition: "NEW", city: "Sialkot", brandSlug: "realme", categorySlug: "smartphones", views: 720, ageDays: 2 },
  { title: "Samsung Galaxy Tab S9 256GB", slug: "samsung-galaxy-tab-s9-256gb", price: 199999, condition: "USED", city: "Lahore", brandSlug: "samsung", categorySlug: "tablets", negotiable: true, views: 520, ageDays: 6 },
  { title: "Apple AirPods Pro 2 (USB-C) — Sealed", slug: "apple-airpods-pro-2-usb-c", price: 64999, condition: "NEW", city: "Islamabad", brandSlug: "apple", categorySlug: "earphones-headphones", views: 880, ageDays: 2 },
  { title: "Vivo V30 5G 8GB/256GB", slug: "vivo-v30-5g", price: 84999, condition: "USED", city: "Gujranwala", brandSlug: "vivo", categorySlug: "smartphones", negotiable: true, views: 295, ageDays: 7 },
  { title: "iPad Air M2 11-inch 128GB Wi-Fi", slug: "ipad-air-m2-11-128gb", price: 244999, condition: "OPEN_BOX", city: "Karachi", brandSlug: "apple", categorySlug: "tablets", views: 470, ageDays: 3 },
];

/** Builds a plausible description + structured attributes from a sample listing. */
function buildListingContent(item: (typeof SAMPLE_LISTINGS)[number]) {
  const combo = item.title.match(/(\d+)\s?GB\s?\/\s?(\d+)\s?GB/i);
  const storageOnly = item.title.match(/(\d+)\s?(GB|TB)\b/i);
  const attributes: Record<string, unknown> = {};
  if (combo) {
    attributes.ram = `${combo[1]}GB`;
    attributes.storage = `${combo[2]}GB`;
  } else if (storageOnly?.[1] && storageOnly[2]) {
    attributes.storage = `${storageOnly[1]}${storageOnly[2].toUpperCase()}`;
  }
  if (/pta/i.test(item.title)) attributes.ptaApproved = true;

  const conditionText = item.condition.toLowerCase().replace("_", " ");
  const description = `${item.title} in ${conditionText} condition, available in ${item.city}. ${
    item.negotiable ? "Price is negotiable — serious buyers only. " : ""
  }Meet in a safe public place and inspect the device before purchase. Box and accessories included where applicable.`;

  return { description, attributes };
}

type ItemResult = "PASS" | "MINOR_ISSUE" | "MAJOR_ISSUE" | "NOT_APPLICABLE";

/** Sample published inspection reports → the "GenTech Inspected" badge on listings. */
const SAMPLE_REPORTS: Array<{
  listingSlug: string;
  verdict: "RECOMMENDED" | "RECOMMENDED_WITH_NOTES" | "NOT_RECOMMENDED";
  summary: string;
  imei: string;
  ptaApproved: boolean;
  batteryHealth: number;
  items: Array<{ category: string; label: string; result: ItemResult; comment?: string }>;
}> = [
  {
    listingSlug: "iphone-15-pro-max-256gb",
    verdict: "RECOMMENDED",
    summary:
      "Excellent condition. Genuine display, healthy battery, all cameras and sensors working perfectly. No signs of prior repair. Safe to buy.",
    imei: "356789101112130",
    ptaApproved: true,
    batteryHealth: 92,
    items: [
      { category: "Display", label: "Screen scratches", result: "PASS" },
      { category: "Display", label: "Touch response", result: "PASS" },
      { category: "Body & Frame", label: "Dents & scratches", result: "PASS" },
      { category: "Battery", label: "Battery health %", result: "PASS", comment: "92% — very good" },
      { category: "Cameras", label: "Rear camera", result: "PASS" },
      { category: "Cameras", label: "Front camera", result: "PASS" },
      { category: "Connectivity", label: "Wi-Fi / Bluetooth", result: "PASS" },
      { category: "Biometrics & Sensors", label: "Face ID", result: "PASS" },
      { category: "Software & Identity", label: "iCloud lock", result: "PASS", comment: "Clean, signed out" },
    ],
  },
  {
    listingSlug: "samsung-galaxy-s24-ultra-512gb",
    verdict: "RECOMMENDED_WITH_NOTES",
    summary:
      "Good overall condition with minor cosmetic wear. A faint hairline scratch on the top-left of the screen (not visible when on) and slightly reduced battery health. Fully functional and fairly priced.",
    imei: "356789101112999",
    ptaApproved: true,
    batteryHealth: 86,
    items: [
      { category: "Display", label: "Screen scratches", result: "MINOR_ISSUE", comment: "Faint hairline, top-left" },
      { category: "Display", label: "Touch response", result: "PASS" },
      { category: "Body & Frame", label: "Dents & scratches", result: "PASS" },
      { category: "Battery", label: "Battery health %", result: "MINOR_ISSUE", comment: "86% — acceptable" },
      { category: "Cameras", label: "Rear camera", result: "PASS" },
      { category: "Cameras", label: "Front camera", result: "PASS" },
      { category: "Connectivity", label: "Mobile signal", result: "PASS" },
      { category: "Biometrics & Sensors", label: "Fingerprint", result: "PASS" },
      { category: "Software & Identity", label: "Account lock", result: "PASS" },
    ],
  },
  {
    listingSlug: "google-pixel-8-pro-128gb",
    verdict: "RECOMMENDED",
    summary:
      "Very clean unit. Battery health excellent, all functions verified. Minor scuff on the frame corner only. Recommended.",
    imei: "356789101113456",
    ptaApproved: true,
    batteryHealth: 95,
    items: [
      { category: "Display", label: "Screen scratches", result: "PASS" },
      { category: "Body & Frame", label: "Frame scuffs", result: "MINOR_ISSUE", comment: "Small scuff, bottom corner" },
      { category: "Battery", label: "Battery health %", result: "PASS", comment: "95% — excellent" },
      { category: "Cameras", label: "Rear camera", result: "PASS" },
      { category: "Cameras", label: "Front camera", result: "PASS" },
      { category: "Connectivity", label: "Wi-Fi / GPS", result: "PASS" },
      { category: "Biometrics & Sensors", label: "Fingerprint", result: "PASS" },
      { category: "Software & Identity", label: "Google account lock", result: "PASS", comment: "Removed" },
    ],
  },
];

/** Mirrors features/inspections/lib/grade.ts (inlined — seed can't import server-only). */
function computeOverallScore(items: Array<{ result: ItemResult }>): number {
  const weights = items
    .map((i): number | null =>
      i.result === "PASS" ? 100 : i.result === "MINOR_ISSUE" ? 60 : i.result === "MAJOR_ISSUE" ? 0 : null,
    )
    .filter((w): w is number => w !== null);
  if (weights.length === 0) return 0;
  return Math.round(weights.reduce((a, b) => a + b, 0) / weights.length);
}

function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
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

    // Sample listings — owned by a demo seller so the catalog looks populated.
    // The demo seller has no auth Account (can't log in); it only owns sample ads.
    const demoSeller = await prisma.user.upsert({
      where: { email: "demo-seller@gentech.local" },
      update: {},
      create: {
        name: "GenTech Demo Store",
        email: "demo-seller@gentech.local",
        emailVerified: true,
      },
    });

    const categoryBySlug = new Map(
      (await prisma.category.findMany({ select: { id: true, slug: true } })).map((c) => [
        c.slug,
        c.id,
      ]),
    );
    const brandBySlug = new Map(
      (await prisma.brand.findMany({ select: { id: true, slug: true } })).map((b) => [
        b.slug,
        b.id,
      ]),
    );

    for (const item of SAMPLE_LISTINGS) {
      const categoryId = categoryBySlug.get(item.categorySlug);
      if (!categoryId) continue; // category not seeded — skip defensively
      const brandId = brandBySlug.get(item.brandSlug) ?? null;
      const { description, attributes } = buildListingContent(item);
      const createdAt = new Date(Date.now() - item.ageDays * 86_400_000);

      const data = {
        title: item.title,
        description,
        price: item.price,
        condition: item.condition,
        status: "ACTIVE" as const,
        city: item.city,
        negotiable: item.negotiable ?? false,
        isFeatured: item.isFeatured ?? false,
        views: item.views ?? 0,
        attributes: attributes as object,
        sellerId: demoSeller.id,
        categoryId,
        brandId,
        createdAt,
      };

      await prisma.listing.upsert({
        where: { slug: item.slug },
        update: {
          title: data.title,
          description: data.description,
          price: data.price,
          condition: data.condition,
          status: data.status,
          city: data.city,
          negotiable: data.negotiable,
          isFeatured: data.isFeatured,
          attributes: data.attributes,
          categoryId: data.categoryId,
          brandId: data.brandId,
        },
        create: { slug: item.slug, ...data },
      });
    }

    // Populate the full-text search vector for any rows that don't have one yet
    // (sample listings are inserted directly, bypassing the app-layer FTS write).
    await prisma.$executeRawUnsafe(
      `UPDATE "listing" SET "searchVector" = to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')) WHERE "searchVector" IS NULL`,
    );

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

    // Published inspection reports on a few sample listings (trust badge demo).
    const inspectorUser = await prisma.user.upsert({
      where: { email: "demo-inspector@gentech.local" },
      update: { role: "INSPECTOR" },
      create: {
        name: "GenTech Certified Inspector",
        email: "demo-inspector@gentech.local",
        emailVerified: true,
        role: "INSPECTOR",
      },
    });
    const buyerUser = await prisma.user.upsert({
      where: { email: "demo-buyer@gentech.local" },
      update: {},
      create: { name: "Ahmed (Buyer)", email: "demo-buyer@gentech.local", emailVerified: true },
    });
    const compPlan = await prisma.inspectionPlan.findUnique({
      where: { slug: "comprehensive-inspection" },
      select: { id: true, name: true, price: true, currency: true },
    });

    for (const rep of SAMPLE_REPORTS) {
      const listing = await prisma.listing.findUnique({
        where: { slug: rep.listingSlug },
        select: { id: true, city: true },
      });
      if (!listing) continue;

      // Idempotent: skip if this buyer already has a request for this listing.
      const existing = await prisma.inspectionRequest.findFirst({
        where: { listingId: listing.id, requesterId: buyerUser.id },
        select: { id: true },
      });
      if (existing) continue;

      const overallScore = computeOverallScore(rep.items);
      await prisma.inspectionRequest.create({
        data: {
          status: "COMPLETED",
          listingId: listing.id,
          requesterId: buyerUser.id,
          inspectorId: inspectorUser.id,
          planId: compPlan?.id ?? null,
          planName: compPlan?.name ?? "Comprehensive Inspection",
          feeAmount: compPlan?.price ?? 2999,
          currency: compPlan?.currency ?? "PKR",
          contactName: "Ahmed",
          contactPhone: "0300-1234567",
          city: listing.city,
          completedAt: new Date(),
          report: {
            create: {
              overallScore,
              grade: scoreToGrade(overallScore),
              verdict: rep.verdict,
              summary: rep.summary,
              imei: rep.imei,
              ptaApproved: rep.ptaApproved,
              batteryHealth: rep.batteryHealth,
              isPublished: true,
              publishedAt: new Date(),
              items: {
                create: rep.items.map((it, i) => ({
                  category: it.category,
                  label: it.label,
                  result: it.result,
                  comment: it.comment,
                  position: i,
                })),
              },
            },
          },
        },
      });
    }

    const [categoryCount, brandCount, planCount, listingCount] = await Promise.all([
      prisma.category.count(),
      prisma.brand.count(),
      prisma.inspectionPlan.count(),
      prisma.listing.count(),
    ]);
    const reportCount = await prisma.inspectionReport.count({ where: { isPublished: true } });
    console.info(
      `✓ Seed complete — ${categoryCount} categories, ${brandCount} brands, ${planCount} inspection plans, ${listingCount} listings, ${reportCount} published reports.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
