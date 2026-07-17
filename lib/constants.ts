/**
 * Centralised, framework-agnostic constants.
 * Single source of truth — never hardcode these values inline.
 */

import { env } from "@/lib/env";

/**
 * Fallbacks mirror the defaults in `lib/env.ts`. They matter only when env
 * validation is skipped (e.g. `SKIP_ENV_VALIDATION=1` during a CI build), where
 * Zod defaults are not applied and the raw value may be `undefined`.
 */
const DEFAULT_APP_NAME = "GenTech";
const DEFAULT_APP_URL = "http://localhost:3000";

/** Application-level metadata. */
export const APP = {
  name: env.NEXT_PUBLIC_APP_NAME ?? DEFAULT_APP_NAME,
  url: env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL,
  description: "Buy and sell mobile phones near you — fast, safe, and simple.",
  locale: "en-PK",
  defaultCurrency: "PKR",
} as const;

/**
 * User roles. A single account may hold buyer + seller capabilities; ADMIN is a
 * privileged superset. Kept in sync with the Prisma `Role` enum.
 */
export const USER_ROLES = {
  USER: "USER",
  INSPECTOR: "INSPECTOR",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/** Canonical client-side route paths. Import these instead of string literals. */
export const ROUTES = {
  home: "/",
  marketplace: "/marketplace",
  categories: "/categories",
  sell: "/sell",
  // Auth
  signIn: "/sign-in",
  signUp: "/sign-up",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  // Account
  dashboard: "/dashboard",
  myListings: "/dashboard/listings",
  savedSearches: "/dashboard/saved-searches",
  messages: "/dashboard/messages",
  notifications: "/dashboard/notifications",
  inspections: "/dashboard/inspections",
  account: "/account",
  // Inspection service (public)
  inspectionService: "/inspection",
  // Inspector workspace
  inspector: "/inspector",
  // Admin
  admin: "/admin",
  adminUsers: "/admin/users",
  adminListings: "/admin/listings",
  adminReports: "/admin/reports",
  adminCategories: "/admin/categories",
  adminInspections: "/admin/inspections",
} as const;

/** Routes a signed-out user may not visit (redirected to sign-in). */
export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/account",
  "/admin",
  "/inspector",
  "/sell",
] as const;

/** Routes a signed-in user should be bounced away from (e.g. back to dashboard). */
export const AUTH_ROUTE_PREFIXES = ["/sign-in", "/sign-up"] as const;

/** Pagination defaults used across feeds and search. */
export const PAGINATION = {
  defaultPageSize: 24,
  maxPageSize: 60,
} as const;

/** Listing condition values — kept in sync with the Prisma `ListingCondition` enum. */
export const LISTING_CONDITIONS = {
  NEW: "NEW",
  OPEN_BOX: "OPEN_BOX",
  USED: "USED",
  REFURBISHED: "REFURBISHED",
  FOR_PARTS: "FOR_PARTS",
} as const;

export type ListingCondition = (typeof LISTING_CONDITIONS)[keyof typeof LISTING_CONDITIONS];

/** Human-readable labels for conditions. */
export const LISTING_CONDITION_LABELS: Record<ListingCondition, string> = {
  NEW: "New",
  OPEN_BOX: "Open Box",
  USED: "Used",
  REFURBISHED: "Refurbished",
  FOR_PARTS: "For Parts",
};

/** Listing lifecycle states — kept in sync with the Prisma `ListingStatus` enum. */
export const LISTING_STATUSES = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  SOLD: "SOLD",
  EXPIRED: "EXPIRED",
  REMOVED: "REMOVED",
} as const;

export type ListingStatus = (typeof LISTING_STATUSES)[keyof typeof LISTING_STATUSES];

/** Human-readable labels for listing statuses. */
export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  SOLD: "Sold",
  EXPIRED: "Expired",
  REMOVED: "Removed",
};

/** Notification kinds — kept in sync with the Prisma `NotificationType` enum. */
export const NOTIFICATION_TYPES = {
  MESSAGE: "MESSAGE",
  LISTING_SOLD: "LISTING_SOLD",
  LISTING_EXPIRED: "LISTING_EXPIRED",
  NEW_REVIEW: "NEW_REVIEW",
  PRICE_DROP: "PRICE_DROP",
  SYSTEM: "SYSTEM",
  INSPECTION_REQUESTED: "INSPECTION_REQUESTED",
  INSPECTION_SCHEDULED: "INSPECTION_SCHEDULED",
  INSPECTION_COMPLETED: "INSPECTION_COMPLETED",
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/** Report lifecycle states — kept in sync with the Prisma `ReportStatus` enum. */
export const REPORT_STATUSES = {
  OPEN: "OPEN",
  REVIEWING: "REVIEWING",
  RESOLVED: "RESOLVED",
  DISMISSED: "DISMISSED",
} as const;

export type ReportStatus = (typeof REPORT_STATUSES)[keyof typeof REPORT_STATUSES];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: "Open",
  REVIEWING: "Reviewing",
  RESOLVED: "Resolved",
  DISMISSED: "Dismissed",
};

/** Human-readable labels for report reasons (Prisma `ReportReason` enum). */
export const REPORT_REASON_LABELS: Record<string, string> = {
  SPAM: "Spam",
  SCAM_OR_FRAUD: "Scam or fraud",
  PROHIBITED_ITEM: "Prohibited item",
  COUNTERFEIT: "Counterfeit",
  OFFENSIVE: "Offensive",
  WRONG_CATEGORY: "Wrong category",
  OTHER: "Other",
};

/** Major Pakistani cities for the location selector. */
export const PK_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Gujranwala",
  "Sialkot",
  "Hyderabad",
  "Bahawalpur",
] as const;

export type PkCity = (typeof PK_CITIES)[number];

// ---------------------------------------------------------------------------
// Inspection service — kept in sync with the Prisma inspection enums.
// ---------------------------------------------------------------------------

/** Inspection request lifecycle — Prisma `InspectionStatus` enum. */
export const INSPECTION_STATUSES = {
  REQUESTED: "REQUESTED",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
} as const;

export type InspectionStatus = (typeof INSPECTION_STATUSES)[keyof typeof INSPECTION_STATUSES];

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  REQUESTED: "Requested",
  PAYMENT_PENDING: "Payment pending",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

/** Payment state of an inspection fee — Prisma `InspectionPaymentStatus` enum. */
export const INSPECTION_PAYMENT_STATUSES = {
  UNPAID: "UNPAID",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
} as const;

export type InspectionPaymentStatus =
  (typeof INSPECTION_PAYMENT_STATUSES)[keyof typeof INSPECTION_PAYMENT_STATUSES];

export const INSPECTION_PAYMENT_STATUS_LABELS: Record<InspectionPaymentStatus, string> = {
  UNPAID: "Unpaid",
  PAID: "Paid",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

/** Supported payment methods (via the aggregator gateway). */
export const PAYMENT_METHODS = {
  JAZZCASH: "jazzcash",
  EASYPAISA: "easypaisa",
  CARD: "card",
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  card: "Debit / Credit Card",
};

/** Report buy recommendation — Prisma `InspectionVerdict` enum. */
export const INSPECTION_VERDICTS = {
  RECOMMENDED: "RECOMMENDED",
  RECOMMENDED_WITH_NOTES: "RECOMMENDED_WITH_NOTES",
  NOT_RECOMMENDED: "NOT_RECOMMENDED",
} as const;

export type InspectionVerdict = (typeof INSPECTION_VERDICTS)[keyof typeof INSPECTION_VERDICTS];

export const INSPECTION_VERDICT_LABELS: Record<InspectionVerdict, string> = {
  RECOMMENDED: "Recommended",
  RECOMMENDED_WITH_NOTES: "Recommended with notes",
  NOT_RECOMMENDED: "Not recommended",
};

/** Result for a single checklist line — Prisma `InspectionItemResult` enum. */
export const INSPECTION_ITEM_RESULTS = {
  PASS: "PASS",
  MINOR_ISSUE: "MINOR_ISSUE",
  MAJOR_ISSUE: "MAJOR_ISSUE",
  NOT_APPLICABLE: "NOT_APPLICABLE",
} as const;

export type InspectionItemResult =
  (typeof INSPECTION_ITEM_RESULTS)[keyof typeof INSPECTION_ITEM_RESULTS];

export const INSPECTION_ITEM_RESULT_LABELS: Record<InspectionItemResult, string> = {
  PASS: "Pass",
  MINOR_ISSUE: "Minor issue",
  MAJOR_ISSUE: "Major issue",
  NOT_APPLICABLE: "N/A",
};

/**
 * Default checklist scaffold an inspector fills in per request. Grouped by the
 * phone component being inspected. Reused to pre-populate a blank report form.
 */
export const INSPECTION_CHECKLIST: ReadonlyArray<{ category: string; items: readonly string[] }> = [
  { category: "Display", items: ["Screen scratches", "Touch response", "Dead pixels / burn-in", "True Tone / brightness"] },
  { category: "Body & Frame", items: ["Dents & scratches", "Bent frame", "Buttons", "SIM tray"] },
  { category: "Battery", items: ["Battery health %", "Charging (wired)", "Charging (wireless)", "Drain under load"] },
  { category: "Cameras", items: ["Rear camera", "Front camera", "Flash", "Autofocus"] },
  { category: "Connectivity", items: ["Wi-Fi", "Bluetooth", "Mobile data / signal", "GPS"] },
  { category: "Biometrics & Sensors", items: ["Face ID / fingerprint", "Proximity sensor", "Gyroscope", "Speakers & mics"] },
  { category: "Software & Identity", items: ["IMEI check", "PTA approval", "iCloud / account lock", "OS version"] },
] as const;
