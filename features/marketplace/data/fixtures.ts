import { LISTING_CONDITIONS } from "@/lib/constants";
import { Region } from "@/lib/generated/prisma/enums";
import type { BrandItem, CategoryItem, ListingCardData } from "@/types/marketplace";

/**
 * Demo data for the marketing/home/marketplace experience when no database is
 * connected. Region-specific fixtures keep Bahrain and Pakistan content isolated.
 */

export const DEMO_CATEGORIES: CategoryItem[] = [
  { id: "c1", name: "Smartphones", slug: "smartphones", icon: "smartphone", count: 1240 },
  { id: "c2", name: "Tablets", slug: "tablets", icon: "tablet", count: 312 },
  { id: "c3", name: "Laptops", slug: "laptops", icon: "laptop", count: 268 },
  { id: "c4", name: "Smart Watches", slug: "smart-watches", icon: "watch", count: 198 },
  { id: "c5", name: "Earphones", slug: "earphones-headphones", icon: "headphones", count: 540 },
  { id: "c6", name: "Chargers & Cables", slug: "chargers-cables", icon: "cable", count: 421 },
  { id: "c7", name: "Laptop Accessories", slug: "laptop-accessories", icon: "keyboard", count: 342 },
  { id: "c8", name: "Tablet Accessories", slug: "tablet-accessories", icon: "tablet", count: 214 },
  { id: "c9", name: "Power Banks", slug: "power-banks", icon: "battery-charging", count: 276 },
  { id: "c10", name: "Cases & Covers", slug: "cases-covers", icon: "shield", count: 833 },
  { id: "c11", name: "Feature Phones", slug: "feature-phones", icon: "phone", count: 154 },
];

const BAHRAIN_CATEGORY_COUNTS: Record<string, number> = {
  smartphones: 384,
  tablets: 96,
  laptops: 84,
  "laptop-accessories": 106,
  "tablet-accessories": 72,
  "smart-watches": 71,
  "earphones-headphones": 168,
  "chargers-cables": 132,
  "power-banks": 84,
  "cases-covers": 260,
  "feature-phones": 38,
};

export const DEMO_BRANDS: BrandItem[] = [
  { id: "b1", name: "Apple", slug: "apple" },
  { id: "b2", name: "Samsung", slug: "samsung" },
  { id: "b3", name: "Xiaomi", slug: "xiaomi" },
  { id: "b4", name: "Oppo", slug: "oppo" },
  { id: "b5", name: "Vivo", slug: "vivo" },
  { id: "b6", name: "Infinix", slug: "infinix" },
  { id: "b7", name: "Realme", slug: "realme" },
  { id: "b8", name: "Google", slug: "google" },
  { id: "b9", name: "Lenovo", slug: "lenovo" },
  { id: "b10", name: "Dell", slug: "dell" },
  { id: "b11", name: "HP", slug: "hp" },
  { id: "b12", name: "Asus", slug: "asus" },
  { id: "b13", name: "Anker", slug: "anker" },
];

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

const PAKISTAN_LISTING_BASE: ListingCardData[] = [
  {
    id: "pk-l1",
    title: "iPhone 15 Pro Max 256GB — PTA Approved",
    slug: "pk-iphone-15-pro-max-256gb",
    price: 419999,
    condition: LISTING_CONDITIONS.USED,
    city: "Karachi",
    brand: "Apple",
    brandSlug: "apple",
    categorySlug: "smartphones",
    storage: "256",
    ram: "8",
    ptaStatus: "PTA_APPROVED",
    isInspected: true,
    isVerifiedSeller: true,
    isFeatured: true,
    negotiable: true,
    views: 1820,
    createdAt: daysAgo(0),
  },
  {
    id: "pk-l2",
    title: "Samsung Galaxy S24 Ultra 512GB",
    slug: "pk-samsung-galaxy-s24-ultra-512gb",
    price: 359999,
    condition: LISTING_CONDITIONS.OPEN_BOX,
    city: "Lahore",
    brand: "Samsung",
    brandSlug: "samsung",
    categorySlug: "smartphones",
    storage: "512",
    ram: "12",
    color: "Black",
    ptaStatus: "NON_PTA",
    isVerifiedSeller: true,
    isDealer: true,
    isFeatured: true,
    views: 1430,
    createdAt: daysAgo(1),
  },
  {
    id: "pk-l3",
    title: "Xiaomi 14 — Brand New, Sealed",
    slug: "pk-xiaomi-14-sealed",
    price: 184999,
    condition: LISTING_CONDITIONS.NEW,
    city: "Islamabad",
    brand: "Xiaomi",
    brandSlug: "xiaomi",
    categorySlug: "smartphones",
    storage: "256",
    ram: "12",
    color: "Green",
    ptaStatus: "PTA_APPROVED",
    isFeatured: true,
    negotiable: true,
    views: 980,
    createdAt: daysAgo(2),
  },
  {
    id: "pk-l4",
    title: "Google Pixel 8 Pro 128GB",
    slug: "pk-google-pixel-8-pro-128gb",
    price: 224999,
    condition: LISTING_CONDITIONS.USED,
    city: "Rawalpindi",
    brand: "Google",
    brandSlug: "google",
    categorySlug: "smartphones",
    storage: "128",
    ram: "12",
    color: "Black",
    ptaStatus: "PTA_APPROVED",
    isFeatured: true,
    views: 1120,
    createdAt: daysAgo(3),
  },
  {
    id: "pk-l5",
    title: "Oppo Reno 11F 5G — Mint Condition",
    slug: "pk-oppo-reno-11f-5g",
    price: 74999,
    condition: LISTING_CONDITIONS.USED,
    city: "Faisalabad",
    brand: "Oppo",
    brandSlug: "oppo",
    categorySlug: "smartphones",
    negotiable: true,
    views: 640,
    createdAt: daysAgo(1),
  },
  {
    id: "pk-l6",
    title: "Apple Watch Series 9 45mm",
    slug: "pk-apple-watch-series-9-45mm",
    price: 119999,
    condition: LISTING_CONDITIONS.OPEN_BOX,
    city: "Karachi",
    brand: "Apple",
    brandSlug: "apple",
    categorySlug: "smart-watches",
    views: 410,
    createdAt: daysAgo(4),
  },
  {
    id: "pk-l7",
    title: "Infinix Note 40 Pro — Refurbished",
    slug: "pk-infinix-note-40-pro",
    price: 48999,
    condition: LISTING_CONDITIONS.REFURBISHED,
    city: "Multan",
    brand: "Infinix",
    brandSlug: "infinix",
    categorySlug: "smartphones",
    negotiable: true,
    views: 305,
    createdAt: daysAgo(5),
  },
  {
    id: "pk-l8",
    title: "Realme GT 6 12GB/256GB",
    slug: "pk-realme-gt-6",
    price: 134999,
    condition: LISTING_CONDITIONS.NEW,
    city: "Sialkot",
    brand: "Realme",
    brandSlug: "realme",
    categorySlug: "smartphones",
    views: 720,
    createdAt: daysAgo(2),
  },
  {
    id: "pk-l9",
    title: "Samsung Galaxy Tab S9 256GB",
    slug: "pk-samsung-galaxy-tab-s9-256gb",
    price: 199999,
    condition: LISTING_CONDITIONS.USED,
    city: "Lahore",
    brand: "Samsung",
    brandSlug: "samsung",
    categorySlug: "tablets",
    negotiable: true,
    views: 520,
    createdAt: daysAgo(6),
  },
  {
    id: "pk-l10",
    title: "Apple AirPods Pro 2 (USB-C) — Sealed",
    slug: "pk-apple-airpods-pro-2-usb-c",
    price: 64999,
    condition: LISTING_CONDITIONS.NEW,
    city: "Islamabad",
    brand: "Apple",
    brandSlug: "apple",
    categorySlug: "earphones-headphones",
    views: 880,
    createdAt: daysAgo(2),
  },
  {
    id: "pk-l11",
    title: "Vivo V30 5G 8GB/256GB",
    slug: "pk-vivo-v30-5g",
    price: 84999,
    condition: LISTING_CONDITIONS.USED,
    city: "Gujranwala",
    brand: "Vivo",
    brandSlug: "vivo",
    categorySlug: "smartphones",
    negotiable: true,
    views: 295,
    createdAt: daysAgo(7),
  },
  {
    id: "pk-l12",
    title: "iPad Air M2 11-inch 128GB Wi-Fi",
    slug: "pk-ipad-air-m2-11-128gb",
    price: 244999,
    condition: LISTING_CONDITIONS.OPEN_BOX,
    city: "Karachi",
    brand: "Apple",
    brandSlug: "apple",
    categorySlug: "tablets",
    views: 470,
    createdAt: daysAgo(3),
  },
  {
    id: "pk-l13",
    title: "MacBook Air M3 13-inch 256GB",
    slug: "pk-macbook-air-m3-13-256gb",
    price: 385000,
    condition: LISTING_CONDITIONS.NEW,
    city: "Lahore",
    brand: "Apple",
    brandSlug: "apple",
    categorySlug: "laptops",
    storage: "256",
    ram: "8",
    color: "Silver",
    isVerifiedSeller: true,
    isFeatured: true,
    views: 620,
    createdAt: daysAgo(0),
  },
  {
    id: "pk-l14",
    title: "Dell XPS 13 9340 — Core i7, 512GB",
    slug: "pk-dell-xps-13-9340",
    price: 340000,
    condition: LISTING_CONDITIONS.OPEN_BOX,
    city: "Karachi",
    brand: "Dell",
    brandSlug: "dell",
    categorySlug: "laptops",
    storage: "512",
    ram: "16",
    color: "Silver",
    isDealer: true,
    views: 540,
    createdAt: daysAgo(1),
  },
  {
    id: "pk-l15",
    title: "Anker USB-C Hub 8-in-1",
    slug: "pk-anker-usbc-hub-8in1",
    price: 18500,
    condition: LISTING_CONDITIONS.NEW,
    city: "Islamabad",
    brand: "Anker",
    brandSlug: "anker",
    categorySlug: "laptop-accessories",
    isVerifiedSeller: true,
    views: 310,
    createdAt: daysAgo(2),
  },
  {
    id: "pk-l16",
    title: "Magic Keyboard for iPad Pro 11-inch",
    slug: "pk-ipad-magic-keyboard",
    price: 92000,
    condition: LISTING_CONDITIONS.USED,
    city: "Lahore",
    brand: "Apple",
    brandSlug: "apple",
    categorySlug: "tablet-accessories",
    views: 280,
    createdAt: daysAgo(4),
  },
];

const BAHRAIN_LISTING_BASE: ListingCardData[] = [
  {
    id: "bh-l1",
    title: "iPhone 15 Pro Max 256GB",
    slug: "bh-iphone-15-pro-max-256gb",
    price: 379.9,
    condition: LISTING_CONDITIONS.USED,
    city: "Manama",
    brand: "Apple",
    brandSlug: "apple",
    categorySlug: "smartphones",
    storage: "256",
    ram: "8",
    isInspected: true,
    isVerifiedSeller: true,
    isFeatured: true,
    negotiable: true,
    views: 1240,
    createdAt: daysAgo(0),
  },
  {
    id: "bh-l2",
    title: "Samsung Galaxy S24 Ultra 512GB",
    slug: "bh-samsung-galaxy-s24-ultra-512gb",
    price: 329.5,
    condition: LISTING_CONDITIONS.OPEN_BOX,
    city: "Riffa",
    brand: "Samsung",
    brandSlug: "samsung",
    categorySlug: "smartphones",
    storage: "512",
    ram: "12",
    color: "Titanium Gray",
    isVerifiedSeller: true,
    isDealer: true,
    isFeatured: true,
    views: 980,
    createdAt: daysAgo(1),
  },
  {
    id: "bh-l3",
    title: "Xiaomi 14 — Brand New, Sealed",
    slug: "bh-xiaomi-14-sealed",
    price: 179.9,
    condition: LISTING_CONDITIONS.NEW,
    city: "Muharraq",
    brand: "Xiaomi",
    brandSlug: "xiaomi",
    categorySlug: "smartphones",
    storage: "256",
    ram: "12",
    color: "White",
    isFeatured: true,
    negotiable: true,
    views: 760,
    createdAt: daysAgo(2),
  },
  {
    id: "bh-l4",
    title: "Google Pixel 8 Pro 128GB",
    slug: "bh-google-pixel-8-pro-128gb",
    price: 209.0,
    condition: LISTING_CONDITIONS.USED,
    city: "Isa Town",
    brand: "Google",
    brandSlug: "google",
    categorySlug: "smartphones",
    storage: "128",
    ram: "12",
    color: "Black",
    isFeatured: true,
    views: 690,
    createdAt: daysAgo(3),
  },
  {
    id: "bh-l5",
    title: "Apple Watch Series 9 45mm",
    slug: "bh-apple-watch-series-9-45mm",
    price: 109.9,
    condition: LISTING_CONDITIONS.OPEN_BOX,
    city: "Sitra",
    brand: "Apple",
    brandSlug: "apple",
    categorySlug: "smart-watches",
    isVerifiedSeller: true,
    views: 430,
    createdAt: daysAgo(1),
  },
  {
    id: "bh-l6",
    title: "Samsung Galaxy Tab S9 256GB",
    slug: "bh-samsung-galaxy-tab-s9-256gb",
    price: 189.0,
    condition: LISTING_CONDITIONS.USED,
    city: "Jid Hafs",
    brand: "Samsung",
    brandSlug: "samsung",
    categorySlug: "tablets",
    negotiable: true,
    views: 380,
    createdAt: daysAgo(4),
  },
  {
    id: "bh-l7",
    title: "Apple AirPods Pro 2 (USB-C) — Sealed",
    slug: "bh-apple-airpods-pro-2-usb-c",
    price: 59.9,
    condition: LISTING_CONDITIONS.NEW,
    city: "Sanabis",
    brand: "Apple",
    brandSlug: "apple",
    categorySlug: "earphones-headphones",
    views: 620,
    createdAt: daysAgo(2),
  },
  {
    id: "bh-l8",
    title: "Realme GT 6 12GB/256GB",
    slug: "bh-realme-gt-6",
    price: 129.5,
    condition: LISTING_CONDITIONS.NEW,
    city: "Budaiya",
    brand: "Realme",
    brandSlug: "realme",
    categorySlug: "smartphones",
    views: 510,
    createdAt: daysAgo(5),
  },
  {
    id: "bh-l9",
    title: "iPad Air M2 11-inch 128GB Wi-Fi",
    slug: "bh-ipad-air-m2-11-128gb",
    price: 224.0,
    condition: LISTING_CONDITIONS.OPEN_BOX,
    city: "Muharraq",
    brand: "Apple",
    brandSlug: "apple",
    categorySlug: "tablets",
    isVerifiedSeller: true,
    views: 350,
    createdAt: daysAgo(3),
  },
  {
    id: "bh-l10",
    title: "Oppo Reno 11F 5G — Mint Condition",
    slug: "bh-oppo-reno-11f-5g",
    price: 72.5,
    condition: LISTING_CONDITIONS.USED,
    city: "Zallaq",
    brand: "Oppo",
    brandSlug: "oppo",
    categorySlug: "smartphones",
    negotiable: true,
    views: 290,
    createdAt: daysAgo(6),
  },
  {
    id: "bh-l11",
    title: "MacBook Air M3 13-inch 256GB",
    slug: "bh-macbook-air-m3-13-256gb",
    price: 365,
    condition: LISTING_CONDITIONS.NEW,
    city: "Manama",
    brand: "Apple",
    brandSlug: "apple",
    categorySlug: "laptops",
    storage: "256",
    ram: "8",
    color: "Silver",
    isInspected: true,
    isVerifiedSeller: true,
    isFeatured: true,
    views: 520,
    createdAt: daysAgo(0),
  },
  {
    id: "bh-l12",
    title: "iPad Pro 11-inch M4 256GB Wi-Fi",
    slug: "bh-ipad-pro-11-m4-256gb",
    price: 345,
    condition: LISTING_CONDITIONS.OPEN_BOX,
    city: "Riffa",
    brand: "Apple",
    brandSlug: "apple",
    categorySlug: "tablets",
    storage: "256",
    isVerifiedSeller: true,
    views: 480,
    createdAt: daysAgo(1),
  },
  {
    id: "bh-l13",
    title: "Anker USB-C Hub 8-in-1",
    slug: "bh-anker-usbc-hub-8in1",
    price: 18,
    condition: LISTING_CONDITIONS.NEW,
    city: "Muharraq",
    brand: "Anker",
    brandSlug: "anker",
    categorySlug: "laptop-accessories",
    isVerifiedSeller: true,
    views: 260,
    createdAt: daysAgo(2),
  },
  {
    id: "bh-l14",
    title: "Magic Keyboard for iPad",
    slug: "bh-ipad-magic-keyboard",
    price: 88,
    condition: LISTING_CONDITIONS.USED,
    city: "Manama",
    brand: "Apple",
    brandSlug: "apple",
    categorySlug: "tablet-accessories",
    views: 220,
    createdAt: daysAgo(5),
  },
];

/** Adds category-specific demo attributes so preview filters behave like the database. */
function withCategorySpecs(listing: ListingCardData): ListingCardData {
  const enriched = { ...listing };
  const title = listing.title.toLowerCase();
  const category = listing.categorySlug;

  if (category === "laptops") {
    enriched.processor = title.includes("m3")
      ? "Apple M3"
      : title.includes("i7")
        ? "Intel Core i7"
        : "Intel Core i5";
    enriched.operatingSystem = title.includes("macbook") ? "macOS" : "Windows 11";
    const size = title.match(/(\d{2})(?:-inch|")/);
    if (size) enriched.screenSize = `${size[1]}"`;
  } else if (category === "tablets") {
    enriched.processor = title.includes("m4")
      ? "Apple M4"
      : title.includes("m2")
        ? "Apple M2"
        : "Snapdragon 8 Gen 2";
    enriched.operatingSystem = title.includes("ipad") ? "iPadOS" : "Android";
    const size = title.match(/(\d{2})(?:-inch|")/);
    if (size) enriched.screenSize = `${size[1]}"`;
    enriched.connectivity = title.includes("cellular") ? "Wi-Fi + Cellular" : "Wi-Fi";
  } else if (category?.endsWith("accessories") || category === "earphones-headphones") {
    enriched.accessoryType = category === "earphones-headphones"
      ? "Headphones"
      : category === "chargers-cables"
        ? "Charger"
        : category === "power-banks"
          ? "Power Bank"
          : category === "cases-covers"
            ? "Case"
            : category === "laptop-accessories"
              ? title.includes("keyboard") ? "Keyboard" : "Hub"
              : "Stylus";
    enriched.connectivity = title.includes("usb-c")
      ? "USB-C"
      : title.includes("lightning")
        ? "Lightning"
        : "Bluetooth";
    enriched.compatibility = title.includes("ipad") || category === "tablet-accessories"
      ? "iPad"
      : title.includes("laptop") || category === "laptop-accessories"
        ? "Laptop"
        : title.includes("iphone") ? "iPhone" : "Universal";
  }

  return enriched;
}

const DEMO_PHOTO_IDS = [
  "1511707171634-5f897ff02aa9",
  "1592750475338-74b7b21085ab",
  "1603891128711-11b4b03bb138",
  "1610945265064-0e34e5519bbf",
  "1598327105666-5b89351aff97",
  "1580910051074-3eb694886505",
];

/** Gives preview listings the same three-photo sliders as the seeded catalog. */
function withDemoImages(listing: ListingCardData, index: number): ListingCardData {
  const imageUrls = Array.from({ length: 3 }, (_, offset) => {
    const photoId = DEMO_PHOTO_IDS[(index + offset) % DEMO_PHOTO_IDS.length]!;
    return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=75`;
  });
  return { ...listing, imageUrl: imageUrls[0], imageUrls };
}

const PAKISTAN_LISTINGS: ListingCardData[] = PAKISTAN_LISTING_BASE.map((listing, index) => ({
  ...withDemoImages(withCategorySpecs(listing), index),
  currency: "PKR",
  region: Region.PAKISTAN,
}));

const BAHRAIN_LISTINGS: ListingCardData[] = BAHRAIN_LISTING_BASE.map((listing, index) => ({
  ...withDemoImages(withCategorySpecs(listing), index),
  currency: "BHD",
  region: Region.BAHRAIN,
}));

/** Backwards-compatible export for the non-localized legacy routes. */
export const DEMO_LISTINGS: ListingCardData[] = PAKISTAN_LISTINGS;
export const DEMO_FEATURED_LISTINGS = DEMO_LISTINGS.filter((l) => l.isFeatured);
export const DEMO_LATEST_LISTINGS = [...DEMO_LISTINGS].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
);

export function getDemoListings(region?: Region): ListingCardData[] {
  return region === Region.BAHRAIN ? BAHRAIN_LISTINGS : PAKISTAN_LISTINGS;
}

export function getDemoFeaturedListings(region?: Region): ListingCardData[] {
  return getDemoListings(region).filter((listing) => listing.isFeatured);
}

export function getDemoLatestListings(region?: Region): ListingCardData[] {
  return [...getDemoListings(region)].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getDemoCategories(region?: Region): CategoryItem[] {
  if (region !== Region.BAHRAIN) return DEMO_CATEGORIES;
  return DEMO_CATEGORIES.map((category) => ({
    ...category,
    count: BAHRAIN_CATEGORY_COUNTS[category.slug],
  }));
}
