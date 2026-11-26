/**
 * Centralised, framework-agnostic constants.
 * Single source of truth — never hardcode these values inline.
 */

import { env } from "@/lib/env";

/**
 * The fallback matters only when env validation is skipped (e.g.
 * `SKIP_ENV_VALIDATION=1` during a CI build), where Zod defaults are not applied.
 */
const DEFAULT_APP_NAME = "GenTech";

/** Application-level metadata. */
export const APP = {
  name: env.NEXT_PUBLIC_APP_NAME ?? DEFAULT_APP_NAME,
  description: "Buy and sell mobile phones near you — fast, safe, and simple.",
  locale: "en-PK",
  defaultCurrency: "PKR",
} as const;

// ---------------------------------------------------------------------------
// Country & Locale constants for multi-country localization.
// ---------------------------------------------------------------------------

/** Supported country codes. */
export const COUNTRY_CODES = {
  BAHRAIN: "BH",
  PAKISTAN: "PK",
} as const;

export type CountryCode = (typeof COUNTRY_CODES)[keyof typeof COUNTRY_CODES];

/** Supported locale codes. */
export const LOCALES = {
  ARABIC: "ar",
  URDU: "ur",
  ENGLISH: "en",
} as const;

export type LocaleCode = (typeof LOCALES)[keyof typeof LOCALES];

/** Default country when no preference is set. */
export const DEFAULT_COUNTRY: CountryCode = COUNTRY_CODES.PAKISTAN;

/** Default locale when no preference is set. */
export const DEFAULT_LOCALE: LocaleCode = LOCALES.ENGLISH;

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
  favorites: "/dashboard/favorites",
  savedSearches: "/dashboard/saved-searches",
  messages: "/dashboard/messages",
  orders: "/dashboard/orders",
  notifications: "/dashboard/notifications",
  inspections: "/dashboard/inspections",
  quotes: "/dashboard/quotes",
  account: "/account",
  // Public utility pages
  imeiCheck: "/imei-check",
  comparison: "/compare",
  valuation: "/valuation",
  // Inspection service (public)
  inspectionService: "/inspection",
  // Sell your phone — instant quote (public)
  sellPhone: "/sell-phone",
  // Inspector workspace
  inspector: "/inspector",
  // Dealers
  dealers: "/dealers",
  dealerDashboard: "/dashboard/dealer",
  dealerApply: "/dashboard/dealer/apply",
  dealerProfile: "/dashboard/dealer/profile",
  dealerBranches: "/dashboard/dealer/branches",
  dealerInventory: "/dashboard/dealer/inventory",
  // Admin
  admin: "/admin",
  adminUsers: "/admin/users",
  adminListings: "/admin/listings",
  adminReports: "/admin/reports",
  adminDealers: "/admin/dealers",
  adminPromotions: "/admin/promotions",
  adminCategories: "/admin/categories",
  adminInspections: "/admin/inspections",
  adminQuotes: "/admin/quotes",
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
  PENDING_APPROVAL: "PENDING_APPROVAL",
  ACTIVE: "ACTIVE",
  REJECTED: "REJECTED",
  SOLD: "SOLD",
  EXPIRED: "EXPIRED",
  REMOVED: "REMOVED",
} as const;

export type ListingStatus = (typeof LISTING_STATUSES)[keyof typeof LISTING_STATUSES];

/** Human-readable labels for listing statuses. */
export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  ACTIVE: "Active",
  REJECTED: "Rejected",
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
  SAVED_SEARCH_MATCH: "SAVED_SEARCH_MATCH",
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
  AWAITING_CUSTOMER: "AWAITING_CUSTOMER",
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
} as const;

export type InspectionPaymentStatus =
  (typeof INSPECTION_PAYMENT_STATUSES)[keyof typeof INSPECTION_PAYMENT_STATUSES];

export const INSPECTION_PAYMENT_STATUS_LABELS: Record<InspectionPaymentStatus, string> = {
  UNPAID: "Unpaid",
  AWAITING_CUSTOMER: "Awaiting payment confirmation",
  PENDING: "Payment pending",
  PROCESSING: "Processing payment",
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

/** Device families supported by the inspection workflow. */
export const INSPECTION_KINDS = {
  PHONE: "PHONE",
  LAPTOP: "LAPTOP",
} as const;

export type InspectionKind = (typeof INSPECTION_KINDS)[keyof typeof INSPECTION_KINDS];

export const INSPECTION_KIND_VALUES = Object.values(INSPECTION_KINDS) as [
  InspectionKind,
  ...InspectionKind[],
];

export const INSPECTION_KIND_LABELS: Record<InspectionKind, string> = {
  PHONE: "Phone",
  LAPTOP: "Laptop",
};

export interface InspectionChecklistGroup {
  category: string;
  items: readonly string[];
}

/**
 * Default phone checklist scaffold an inspector fills in per request. Kept as the
 * named export for backwards compatibility; use `INSPECTION_CHECKLISTS` for new code.
 */
export const INSPECTION_CHECKLIST: ReadonlyArray<InspectionChecklistGroup> = [
  { category: "Display", items: ["Screen scratches", "Touch response", "Dead pixels / burn-in", "True Tone / brightness"] },
  { category: "Body & Frame", items: ["Dents & scratches", "Bent frame", "Buttons", "SIM tray"] },
  { category: "Battery", items: ["Battery health %", "Charging (wired)", "Charging (wireless)", "Drain under load"] },
  { category: "Cameras", items: ["Rear camera", "Front camera", "Flash", "Autofocus"] },
  { category: "Connectivity", items: ["Wi-Fi", "Bluetooth", "Mobile data / signal", "GPS"] },
  { category: "Biometrics & Sensors", items: ["Face ID / fingerprint", "Proximity sensor", "Gyroscope", "Speakers & mics"] },
  { category: "Software & Identity", items: ["IMEI check", "PTA approval", "iCloud / account lock", "OS version"] },
] as const;

/** Laptop checklist — no IMEI/PTA; focuses on chassis, input, performance and ports. */
export const LAPTOP_INSPECTION_CHECKLIST: ReadonlyArray<InspectionChecklistGroup> = [
  { category: "Display", items: ["Screen scratches", "Dead pixels / backlight bleed", "Brightness & colour", "Webcam"] },
  { category: "Chassis & Keyboard", items: ["Dents & scratches", "Hinge firmness", "Keyboard (all keys)", "Trackpad & gestures"] },
  { category: "Performance", items: ["CPU / benchmark", "RAM recognition", "Storage health", "Thermals & fan noise"] },
  { category: "Battery & Charging", items: ["Battery condition %", "Charging (adapter)", "Drain under load", "Power button"] },
  { category: "Ports & Connectivity", items: ["USB / HDMI ports", "Wi-Fi", "Bluetooth", "Speakers & microphone"] },
  { category: "OS & Security", items: ["OS version & activation", "BIOS / firmware password", "Find My Device / account lock", "Serial number check"] },
] as const;

export const INSPECTION_CHECKLISTS: Record<InspectionKind, ReadonlyArray<InspectionChecklistGroup>> = {
  PHONE: INSPECTION_CHECKLIST,
  LAPTOP: LAPTOP_INSPECTION_CHECKLIST,
};

/** Checklist used to pre-populate a blank report form for a device family. */
export function getInspectionChecklist(kind: InspectionKind): ReadonlyArray<InspectionChecklistGroup> {
  return INSPECTION_CHECKLISTS[kind] ?? INSPECTION_CHECKLIST;
}

/**
 * PTA (Pakistan Telecommunication Authority) status for mobile devices.
 */
export const PTA_STATUS = {
  PTA_APPROVED: "PTA_APPROVED",
  NON_PTA: "NON_PTA",
  CPID: "CPID",
  FACTORY_UNLOCKED: "FACTORY_UNLOCKED",
  CARRIER_LOCKED: "CARRIER_LOCKED",
  UNKNOWN: "UNKNOWN",
  VERIFICATION_PENDING: "VERIFICATION_PENDING",
} as const;

/**
 * CPID (Compliance ID) status for mobile devices.
 */
export const CPID_STATUS = {
  CPID_APPROVED: "CPID_APPROVED",
  NON_CPID: "NON_CPID",
  UNKNOWN: "UNKNOWN",
} as const;

/**
 * Network type for mobile devices.
 */
export const NETWORK_TYPE = {
  SINGLE_SIM: "SINGLE_SIM",
  DUAL_SIM: "DUAL_SIM",
  ESIM: "ESIM",
  HYBRID: "HYBRID",
} as const;

/**
 * Warranty type for mobile devices.
 */
export const WARRANTY_TYPE = {
  NO_WARRANTY: "NO_WARRANTY",
  MANUFACTURER: "MANUFACTURER",
  SELLER: "SELLER",
  THIRD_PARTY: "THIRD_PARTY",
} as const;

/**
 * Storage options for mobile devices (in GB).
 */
export const STORAGE_OPTIONS = ["32", "64", "128", "256", "512"] as const;

/**
 * RAM options for mobile devices (in GB).
 */
export const RAM_OPTIONS = ["2", "3", "4", "6", "8", "12", "16"] as const;

// ---------------------------------------------------------------------------
// Sell Your Phone — instant quote. Kept in sync with the Prisma quote enums.
// ---------------------------------------------------------------------------

/** PTA status of a device — Prisma `QuotePtaStatus` enum. English + Urdu labels. */
export const PTA_STATUSES = {
  PTA: "PTA",
  NON_PTA: "NON_PTA",
  PATCHED: "PATCHED",
  JV: "JV",
} as const;

export type PtaStatus = (typeof PTA_STATUSES)[keyof typeof PTA_STATUSES];

export const PTA_STATUS_LABELS: Record<PtaStatus, string> = {
  PTA: "PTA Approved",
  NON_PTA: "Non-PTA",
  PATCHED: "Patched",
  JV: "JV (Factory Unlocked)",
};

/** Buy-back quote lifecycle — Prisma `QuoteStatus` enum. */
export const QUOTE_STATUSES = {
  /** Submitted by the seller, awaiting manual admin review. */
  PENDING: "PENDING",
  /** Admin approved + set an offer price; the seller can now accept. */
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  ACCEPTED: "ACCEPTED",
  INSPECTED: "INSPECTED",
  PAID: "PAID",
  /** Admin declined the request (reason in `declineReason`). */
  DECLINED: "DECLINED",
} as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[keyof typeof QUOTE_STATUSES];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  PENDING: "Pending review",
  ACTIVE: "Offer ready",
  EXPIRED: "Expired",
  ACCEPTED: "Accepted",
  INSPECTED: "Inspected",
  PAID: "Paid",
  DECLINED: "Declined",
};

/** AI letter grades a device can receive. */
export const QUOTE_GRADES = {
  A: "A",
  B: "B",
  C: "C",
} as const;

export type QuoteGrade = (typeof QUOTE_GRADES)[keyof typeof QUOTE_GRADES];

/** Physical-inspection outcome — Prisma `QuoteInspectionResult` enum. */
export const QUOTE_INSPECTION_RESULTS = {
  MATCH: "MATCH",
  MISMATCH: "MISMATCH",
} as const;

export type QuoteInspectionResult =
  (typeof QUOTE_INSPECTION_RESULTS)[keyof typeof QUOTE_INSPECTION_RESULTS];

/**
 * Pricing policy for quotes. The grade multipliers are seeded into the
 * admin-editable `QuoteSetting` table; these are the fallback defaults used when
 * a setting row is missing. Range + rounding are fixed product rules.
 */
export const QUOTE_PRICING = {
  /** Default grade multipliers (admin can override via QuoteSetting). */
  gradeMultipliers: { A: 1.0, B: 0.88, C: 0.75 } as Record<QuoteGrade, number>,
  /** price_min = price × (1 − 0.03). */
  rangeMinPct: 0.03,
  /** price_max = price × (1 + 0.02). */
  rangeMaxPct: 0.02,
  /** Round every displayed figure to the nearest Rs. */
  roundTo: 500,
  /** Quote is honoured for this many hours from creation. */
  validityHours: 72,
  /** iPhones must report battery health; below this a deduction applies. */
  batteryHealthThreshold: 85,
  /** Grade is lowered one step when the AI reports this many+ mismatches. */
  mismatchGradeDropThreshold: 1,
  /** Below this AI confidence we ask the seller to retake before pricing. */
  minConfidence: 0.6,
} as const;

/** QuoteSetting keys for the admin-editable grade multipliers. */
export const QUOTE_SETTING_KEYS = {
  gradeMultiplierA: "grade_multiplier_a",
  gradeMultiplierB: "grade_multiplier_b",
  gradeMultiplierC: "grade_multiplier_c",
} as const;

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

/**
 * One-time password policy for inspection booking. This is the single
 * source of truth for the service, actions and UI copy.
 */
export const OTP = {
  /** Number of digits in the generated code. */
  length: 6,
  /** How long a freshly sent code stays usable. */
  ttlMinutes: 10,
  /** Max failed check attempts before the code is burned and a resend is needed. */
  maxAttempts: 5,
  /** Minimum gap between resends to the same number. */
  resendCooldownSeconds: 30,
  /** How long a successful verification counts toward a booking. */
  validForMinutes: 30,
} as const;

/** Channels a one-time code can be delivered over. */
export const OTP_CHANNELS = {
  SMS: "sms",
  WHATSAPP: "whatsapp",
} as const;

export type OtpChannel = (typeof OTP_CHANNELS)[keyof typeof OTP_CHANNELS];
