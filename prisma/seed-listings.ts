/**
 * Deterministic catalog fixture generator for marketplace seed data.
 *
 * Produces 100 Pakistan listings (12 curated + 88 generated), 100 Bahrain
 * listings, and 30 expansion listings per region for laptops, tablets and their
 * accessories. Every listing carries external image links so seeded catalogs
 * are visually populated without uploading binary assets.
 */

export type SeedRegion = "BAHRAIN" | "PAKISTAN";
export type SeedCondition = "NEW" | "OPEN_BOX" | "USED" | "REFURBISHED" | "FOR_PARTS";

export interface SeedListing {
  title: string;
  slug: string;
  price: number;
  condition: SeedCondition;
  city: string;
  brandSlug: string;
  categorySlug: string;
  region: SeedRegion;
  currency: "PKR" | "BHD";
  isFeatured: boolean;
  negotiable: boolean;
  views: number;
  ageDays: number;
  images: string[];
  /** Structured characteristics used by category-aware marketplace filters. */
  attributes?: Record<string, string | number | boolean>;
}

export const IMAGES_PER_LISTING = 3;

const PHOTO_IDS = {
  smartphones: [
    "1511707171634-5f897ff02aa9",
    "1592750475338-74b7b21085ab",
    "1603891128711-11b4b03bb138",
    "1610945265064-0e34e5519bbf",
    "1598327105666-5b89351aff97",
    "1580910051074-3eb694886505",
    "1574944985070-8f3ebc6b79d2",
    "1606220588913-b3aacb4d2f46",
    "1610945415295-d9bbf067e59c",
    "1616348436168-de43ad0db179",
    "1605236453806-6ff36851218e",
    "1512499617640-c74ae3a79d37",
    "1556656793-08538906a9f8",
    "1567016432779-094069958ea5",
    "1587829741301-dc798b83add3",
    "1590658268037-6bf12165a8df",
    "1600185365483-26d7a4cc7519",
    "1511381939415-e44015466834",
  ],
  tablets: [
    "1572569511254-d8f925fe2cbb",
    "1511381939415-e44015466834",
    "1511707171634-5f897ff02aa9",
    "1592750475338-74b7b21085ab",
    "1603891128711-11b4b03bb138",
    "1580910051074-3eb694886505",
  ],
  laptops: [
    "1496181133206-80ce9b88a853",
    "1517336714731-489689fd1ca8",
    "1527443224154-c4a3942d3acf",
    "1593642632823-8f785ba67e45",
    "1541807084-5c52b6b3adef",
  ],
  "laptop-accessories": [
    "1587829741301-dc798b83add3",
    "1527863030438-95d54bf9b9cf",
    "1511381939415-e44015466834",
    "1572569511254-d8f925fe2cbb",
    "1505740420928-5e560c06d30e",
  ],
  "tablet-accessories": [
    "1572569511254-d8f925fe2cbb",
    "1583394838336-acd977736f90",
    "1505740420928-5e560c06d30e",
    "1546868871-7041f2a55e12",
    "1511381939415-e44015466834",
  ],
  "smart-watches": [
    "1546868871-7041f2a55e12",
    "1523275335684-37898b6baf30",
    "1524592094714-0f0654e20314",
    "1590658268037-6bf12165a8df",
  ],
  "earphones-headphones": [
    "1505740420928-5e560c06d30e",
    "1583394838336-acd977736f90",
    "1511381939415-e44015466834",
    "1572569511254-d8f925fe2cbb",
  ],
} as const;

const DEFAULT_PHOTO_IDS = PHOTO_IDS.smartphones;

/** Returns stable, optimized external image links for a listing. */
export function listingImages(categorySlug: string, seedIndex: number): string[] {
  const pool: readonly string[] = PHOTO_IDS[categorySlug as keyof typeof PHOTO_IDS] ?? DEFAULT_PHOTO_IDS;

  return Array.from({ length: IMAGES_PER_LISTING }, (_, offset) => {
    const photoId = pool[(seedIndex + offset) % pool.length]!;
    return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=75`;
  });
}

const PK_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Sialkot",
  "Gujranwala",
  "Peshawar",
  "Quetta",
] as const;

const BH_CITIES = [
  "Manama",
  "Riffa",
  "Muharraq",
  "Salmaniya",
  "Isa Town",
  "Sitra",
  "Zallaq",
  "Hamad Town",
  "Budaiya",
  "Sanabis",
] as const;

const VARIANTS = [
  { label: "Sealed", slug: "sealed", factor: 1.12, condition: "NEW" },
  { label: "Box Included", slug: "box-included", factor: 1.05, condition: "OPEN_BOX" },
  { label: "Pre-Owned", slug: "pre-owned", factor: 0.86, condition: "USED" },
  { label: "Certified Refurbished", slug: "certified-refurbished", factor: 0.74, condition: "REFURBISHED" },
  { label: "Bundle Deal", slug: "bundle-deal", factor: 1, condition: "OPEN_BOX" },
] as const satisfies ReadonlyArray<{
  label: string;
  slug: string;
  factor: number;
  condition: SeedCondition;
}>;

interface DeviceTemplate {
  brandSlug: string;
  categorySlug: string;
  model: string;
  slug: string;
  pricePkr: number;
  priceBhd: number;
}

const DEVICE_TEMPLATES: readonly DeviceTemplate[] = [
  { brandSlug: "apple", categorySlug: "smartphones", model: "iPhone 15 Pro 256GB", slug: "iphone-15-pro-256gb", pricePkr: 365000, priceBhd: 345 },
  { brandSlug: "apple", categorySlug: "smartphones", model: "iPhone 14 128GB", slug: "iphone-14-128gb", pricePkr: 235000, priceBhd: 225 },
  { brandSlug: "samsung", categorySlug: "smartphones", model: "Galaxy S24 Ultra 512GB", slug: "galaxy-s24-ultra-512gb", pricePkr: 355000, priceBhd: 335 },
  { brandSlug: "samsung", categorySlug: "smartphones", model: "Galaxy Z Flip 5 256GB", slug: "galaxy-z-flip-5-256gb", pricePkr: 285000, priceBhd: 270 },
  { brandSlug: "xiaomi", categorySlug: "smartphones", model: "Xiaomi 14 256GB", slug: "xiaomi-14-256gb", pricePkr: 185000, priceBhd: 175 },
  { brandSlug: "xiaomi", categorySlug: "smartphones", model: "Redmi Note 13 Pro 256GB", slug: "redmi-note-13-pro-256gb", pricePkr: 78000, priceBhd: 75 },
  { brandSlug: "oppo", categorySlug: "smartphones", model: "Reno 11 Pro 256GB", slug: "reno-11-pro-256gb", pricePkr: 118000, priceBhd: 112 },
  { brandSlug: "vivo", categorySlug: "smartphones", model: "V30 Pro 256GB", slug: "v30-pro-256gb", pricePkr: 112000, priceBhd: 106 },
  { brandSlug: "realme", categorySlug: "smartphones", model: "GT 6 Pro 512GB", slug: "gt-6-pro-512gb", pricePkr: 165000, priceBhd: 158 },
  { brandSlug: "infinix", categorySlug: "smartphones", model: "Note 40 Pro 256GB", slug: "note-40-pro-256gb", pricePkr: 62000, priceBhd: 59 },
  { brandSlug: "tecno", categorySlug: "smartphones", model: "Camon 20 Pro 256GB", slug: "camon-20-pro-256gb", pricePkr: 58000, priceBhd: 55 },
  { brandSlug: "google", categorySlug: "smartphones", model: "Pixel 8 Pro 128GB", slug: "pixel-8-pro-128gb", pricePkr: 225000, priceBhd: 215 },
  { brandSlug: "oneplus", categorySlug: "smartphones", model: "OnePlus 12 256GB", slug: "oneplus-12-256gb", pricePkr: 245000, priceBhd: 232 },
  { brandSlug: "huawei", categorySlug: "smartphones", model: "Nova 12 Pro 512GB", slug: "nova-12-pro-512gb", pricePkr: 132000, priceBhd: 125 },
  { brandSlug: "motorola", categorySlug: "smartphones", model: "Edge 50 Ultra 512GB", slug: "edge-50-ultra-512gb", pricePkr: 178000, priceBhd: 168 },
  { brandSlug: "samsung", categorySlug: "tablets", model: "Galaxy Tab S9 256GB", slug: "galaxy-tab-s9-256gb", pricePkr: 205000, priceBhd: 195 },
  { brandSlug: "apple", categorySlug: "tablets", model: "iPad Air M2 128GB", slug: "ipad-air-m2-128gb", pricePkr: 248000, priceBhd: 235 },
  { brandSlug: "apple", categorySlug: "smart-watches", model: "Watch Series 9 45mm", slug: "watch-series-9-45mm", pricePkr: 118000, priceBhd: 112 },
  { brandSlug: "samsung", categorySlug: "smart-watches", model: "Galaxy Watch6 Classic", slug: "galaxy-watch6-classic", pricePkr: 92000, priceBhd: 87 },
  { brandSlug: "apple", categorySlug: "earphones-headphones", model: "AirPods Pro 2 USB-C", slug: "airpods-pro-2-usb-c", pricePkr: 64000, priceBhd: 61 },
];

/** Newer device categories added without changing the existing 200 seeded rows. */
const EXPANSION_TEMPLATES: readonly DeviceTemplate[] = [
  { brandSlug: "apple", categorySlug: "laptops", model: "MacBook Air M3 13-inch", slug: "macbook-air-m3-13", pricePkr: 385000, priceBhd: 365 },
  { brandSlug: "dell", categorySlug: "laptops", model: "XPS 13 9340", slug: "dell-xps-13-9340", pricePkr: 340000, priceBhd: 322 },
  { brandSlug: "apple", categorySlug: "tablets", model: "iPad Pro 11-inch M4", slug: "ipad-pro-11-m4", pricePkr: 365000, priceBhd: 345 },
  { brandSlug: "samsung", categorySlug: "tablets", model: "Galaxy Tab S9 FE 128GB", slug: "galaxy-tab-s9-fe-128gb", pricePkr: 145000, priceBhd: 138 },
  { brandSlug: "anker", categorySlug: "laptop-accessories", model: "USB-C Hub 8-in-1", slug: "anker-usbc-hub-8in1", pricePkr: 18500, priceBhd: 18 },
  { brandSlug: "apple", categorySlug: "tablet-accessories", model: "Magic Keyboard for iPad", slug: "ipad-magic-keyboard", pricePkr: 92000, priceBhd: 88 },
];

const MAX_GENERATED_PER_REGION = 100;

const DEVICE_STORAGE = ["128GB", "256GB", "512GB"] as const;
const DEVICE_RAM = ["8GB", "12GB", "16GB"] as const;

/** Deterministic specification attributes for category-specific marketplace filters. */
function deviceAttributes(template: DeviceTemplate, variantIndex: number): Record<string, string> {
  const model = template.model.toLowerCase();
  const attributes: Record<string, string> = {};
  const storage = DEVICE_STORAGE[variantIndex % DEVICE_STORAGE.length]!;
  const ram = DEVICE_RAM[variantIndex % DEVICE_RAM.length]!;

  if (template.categorySlug === "laptops") {
    attributes.storage = storage;
    attributes.ram = ram;
    attributes.processor = model.includes("m3")
      ? "Apple M3"
      : model.includes("m4")
        ? "Apple M4"
        : model.includes("i7")
          ? "Intel Core i7"
          : "Intel Core i5";
    attributes.operatingSystem = model.includes("macbook") ? "macOS" : "Windows 11";
    attributes.screenSize = model.includes("13") ? '13"' : model.includes("15") ? '15"' : '14"';
  } else if (template.categorySlug === "tablets") {
    attributes.storage = storage;
    attributes.ram = ram;
    attributes.processor = model.includes("m4")
      ? "Apple M4"
      : model.includes("m2")
        ? "Apple M2"
        : "Snapdragon 8 Gen 2";
    attributes.operatingSystem = model.includes("ipad") ? "iPadOS" : "Android";
    attributes.screenSize = model.includes("11") ? '11"' : '12"';
    attributes.connectivity = variantIndex % 2 === 0 ? "Wi-Fi" : "Wi-Fi + Cellular";
  } else if (template.categorySlug === "laptop-accessories") {
    attributes.accessoryType = model.includes("hub") ? "Hub" : "Keyboard";
    attributes.connectivity = "USB-C";
    attributes.compatibility = "Laptop";
  } else if (template.categorySlug === "tablet-accessories") {
    attributes.accessoryType = model.includes("keyboard") ? "Keyboard" : "Stylus";
    attributes.connectivity = "Bluetooth";
    attributes.compatibility = "iPad";
  }

  return attributes;
}

/**
 * Builds deterministic generated listings for one region. `count` must not
 * exceed 100; the seed uses 88 for Pakistan (with 12 curated listings) and 100
 * for Bahrain.
 */
export function buildGeneratedListings(region: SeedRegion, count: number): SeedListing[] {
  if (!Number.isInteger(count) || count < 0 || count > MAX_GENERATED_PER_REGION) {
    throw new RangeError(`Generated listing count must be between 0 and ${MAX_GENERATED_PER_REGION}.`);
  }

  const prefix = region === "BAHRAIN" ? "bh" : "pk";
  const cities = region === "BAHRAIN" ? BH_CITIES : PK_CITIES;
  const seedOffset = region === "BAHRAIN" ? 500 : 100;

  const listings: SeedListing[] = [];
  for (let index = 0; index < count; index += 1) {
    const template = DEVICE_TEMPLATES[Math.floor(index / VARIANTS.length)]!;
    const variant = VARIANTS[index % VARIANTS.length]!;
    const city = cities[(index + Math.floor(index / VARIANTS.length)) % cities.length]!;
    const price =
      region === "BAHRAIN"
        ? Number((template.priceBhd * variant.factor).toFixed(3))
        : Math.round(template.pricePkr * variant.factor);

    listings.push({
      title: `${template.model} — ${variant.label}`,
      slug: `${prefix}-${template.slug}-${variant.slug}`,
      price,
      condition: variant.condition,
      city,
      brandSlug: template.brandSlug,
      categorySlug: template.categorySlug,
      region,
      currency: region === "BAHRAIN" ? "BHD" : "PKR",
      isFeatured: index % 11 === 0,
      negotiable: index % 4 !== 0,
      views: 90 + ((index * 53 + variant.slug.length * 29) % 2100),
      ageDays: index % 30,
      images: listingImages(template.categorySlug, seedOffset + index),
      attributes: deviceAttributes(template, index % VARIANTS.length),
    });
  }

  return listings;
}

/** Builds the laptop, tablet and accessory inventory added to both regions. */
export function buildExpansionListings(region: SeedRegion): SeedListing[] {
  const prefix = region === "BAHRAIN" ? "bh" : "pk";
  const cities = region === "BAHRAIN" ? BH_CITIES : PK_CITIES;
  const seedOffset = region === "BAHRAIN" ? 900 : 700;

  return EXPANSION_TEMPLATES.flatMap((template, templateIndex) =>
    VARIANTS.map((variant, variantIndex) => {
      const index = templateIndex * VARIANTS.length + variantIndex;
      const city = cities[(index + templateIndex) % cities.length]!;
      const price =
        region === "BAHRAIN"
          ? Number((template.priceBhd * variant.factor).toFixed(3))
          : Math.round(template.pricePkr * variant.factor);

      return {
        title: `${template.model} — ${variant.label}`,
        slug: `${prefix}-${template.slug}-${variant.slug}`,
        price,
        condition: variant.condition,
        city,
        brandSlug: template.brandSlug,
        categorySlug: template.categorySlug,
        region,
        currency: region === "BAHRAIN" ? "BHD" : "PKR",
        isFeatured: templateIndex % 2 === 0 && variantIndex === 0,
        negotiable: variantIndex % 3 !== 0,
        views: 120 + ((index * 47 + template.slug.length * 31) % 1800),
        ageDays: index % 21,
        images: listingImages(template.categorySlug, seedOffset + index),
        attributes: deviceAttributes(template, variantIndex),
      };
    }),
  );
}
