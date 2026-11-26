import type { ListingCondition } from "@/lib/constants";
import type { Region } from "@/lib/generated/prisma/enums";

/** Lightweight category for nav/grid display. */
export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  /** lucide icon name (resolved in the UI). */
  icon?: string;
  count?: number;
}

export interface BrandItem {
  id: string;
  name: string;
  slug: string;
}

/** View-model for a listing card. Mirrors what a DB query projects. */
export interface ListingCardData {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency?: string;
  region?: Region;
  condition: ListingCondition;
  city: string;
  brand?: string;
  brandSlug?: string;
  categorySlug?: string;
  isFeatured?: boolean;
  negotiable?: boolean;
  views?: number;
  /** ISO timestamp. */
  createdAt: string;
  /** Primary image URL; when absent the card renders a branded gradient tile. */
  imageUrl?: string;
  /** Up to four listing images in display order; powers the mobile card slider. */
  imageUrls?: string[];
  /** Phone-specific attributes for marketplace cards */
  storage?: string;
  ram?: string;
  color?: string;
  batteryHealth?: number;
  ptaStatus?: string;
  cpidStatus?: string;
  /** Free-text phone model captured in the listing attributes. */
  model?: string;
  modelNumber?: string;
  warranty?: string;
  /** Category-specific specifications shared by tablets, laptops and accessories. */
  processor?: string;
  operatingSystem?: string;
  screenSize?: string;
  connectivity?: string;
  accessoryType?: string;
  compatibility?: string;
  isInspected?: boolean;
  isVerifiedSeller?: boolean;
  isDealer?: boolean;
}

/** Sort options for the marketplace feed. */
export type ListingSort = "recent" | "price_asc" | "price_desc" | "popular";

/** Normalised marketplace filter set (parsed from URL search params). */
export interface ListingFilters {
  q?: string;
  category?: string;
  brand?: string;
  condition?: ListingCondition;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: ListingSort;
  page: number;
  pageSize: number;
  // Phone-specific filters
  storage?: string;
  ram?: string;
  color?: string;
  batteryHealthMin?: number;
  ptaStatus?: string;
  cpidStatus?: string;
  warranty?: string;
  processor?: string;
  operatingSystem?: string;
  screenSize?: string;
  connectivity?: string;
  accessoryType?: string;
  compatibility?: string;
  isInspected?: boolean;
  isVerifiedSeller?: boolean;
  isDealer?: boolean;
}

/** Values available in active listings, so filters never offer stale choices. */
export interface ListingFilterOptions {
  storage: string[];
  ram: string[];
  colors: string[];
}

/** A page of listings plus metadata for pagination UI. */
export interface ListingSearchResult {
  items: ListingCardData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** A single image for the detail gallery. */
export interface ListingImageData {
  url: string;
  width?: number;
  height?: number;
  /** True only for derived/synthesized views, never for a seller's photograph. */
  isGenerated?: boolean;
}

/** Supporting asset for a GLTF model (uri as referenced inside the .gltf file). */
export interface ListingModelAssetData {
  uri: string;
  url: string;
  publicId: string;
  bytes: number;
}

export type ListingModelSourceType = "UPLOADED" | "GENERATED";
export type ListingModelProcessingStatus = "GENERATING" | "READY" | "FAILED";

/** Optional 3D model. Provenance is explicit: seller-supplied or browser-generated. */
export interface ListingModelData {
  url: string;
  publicId: string;
  format: "GLB" | "GLTF";
  sizeBytes: number;
  assets: ListingModelAssetData[];
  sourceType?: ListingModelSourceType;
  processingStatus?: ListingModelProcessingStatus;
  sourceImageUrl?: string;
  sourceImagePublicId?: string;
  generator?: string;
  generatorVersion?: string;
  generationReceipt?: {
    runId?: string;
    vertices?: number;
    faces?: number;
    durationMs?: number;
  };
}

/** A formatted attribute row for the specs table. */
export interface AttributePair {
  label: string;
  value: string;
}

/** The seller summary shown on a listing detail page. */
export interface ListingSeller {
  id?: string;
  name: string;
  image?: string | null;
  phone?: string;
  city?: string;
  /** ISO timestamp of account creation. */
  memberSince?: string;
  rating?: number;
  reviewCount?: number;
}

/** Full view-model for the listing detail page. */
export interface ListingDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  region?: Region;
  condition: ListingCondition;
  negotiable: boolean;
  city: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  brand?: string;
  brandSlug?: string;
  categorySlug?: string;
  categoryName?: string;
  isFeatured: boolean;
  views: number;
  createdAt: string;
  images: ListingImageData[];
  model3d?: ListingModelData | null;
  attributes: AttributePair[];
  seller: ListingSeller;
  videoUrl?: string;
}
