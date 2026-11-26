import type {
  ListingStatus,
  ReportStatus,
  UserRole,
} from "@/lib/constants";
import type { ReportReason } from "@/lib/generated/prisma/client";

/** Headline metrics for the admin overview. */
export interface PlatformStats {
  totalUsers: number;
  newUsers7d: number;
  totalListings: number;
  pendingListings: number;
  activeListings: number;
  rejectedListings: number;
  soldListings: number;
  openReports: number;
  totalBrands: number;
  totalModels: number;
  totalDealers: number;

}

/** A row in the admin users table. */
export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  banned: boolean;
  emailVerified: boolean;
  listingCount: number;
  createdAt: string;

}

/** A row in the admin listings table. */
export interface AdminListingRow {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  status: ListingStatus;
  region: string;
  city: string;
  views: number;
  sellerName: string;
  createdAt: string;
}

/** A row in the admin reports queue. */
export interface AdminReportRow {
  id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  reporterName: string;
  listing: { title: string; slug: string } | null;
  reportedUserName: string | null;
  createdAt: string;
}

/** A row in the admin category tree. */
export interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  parentName: string | null;
  isActive: boolean;
  listingCount: number;
  position: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** A marketplace country as used by region-scoped analytics. */
export type MarketRegion = "BAHRAIN" | "PAKISTAN";

/** One row of the region/city/area breakdown shown in the admin dashboard. */
export interface RegionLocationCount {
  name: string;
  count: number;
}

/** Region-scoped marketplace metrics, using each region's own currency. */
export interface RegionMetric {
  region: MarketRegion;
  label: string;
  flag: string;
  currency: string;
  users: number;
  listings: number;
  activeListings: number;
  orders: number;
  paidPayments: number;
  /** Gross completed payment amount in the region's own currency. Never cross-converted. */
  paymentVolume: number;
  topCities: RegionLocationCount[];
  topAreas: RegionLocationCount[];
}

export interface RegionAnalytics {
  regions: RegionMetric[];
  generatedAt: string;
}

/** Region-scoped buyer funnel derived from persisted marketplace state. */
export interface ConversionFunnelMetric {
  region: MarketRegion;
  label: string;
  flag: string;
  views: number;
  favorites: number;
  chats: number;
  orders: number;
  paidOrders: number;
  /** Percent of listing views that started a conversation. */
  viewToChatRate: number;
  /** Percent of conversations that became an order. */
  chatToOrderRate: number;
  /** Percent of listing views that became an order. */
  viewToOrderRate: number;
}

export interface ConversionFunnel {
  metrics: ConversionFunnelMetric[];
  generatedAt: string;
}
