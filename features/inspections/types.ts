import type {
  InspectionItemResult,
  InspectionPaymentStatus,
  InspectionStatus,
  InspectionVerdict,
  PaymentMethod,
} from "@/lib/constants";

/** A priced inspection package shown on the request form + pricing page. */
export interface InspectionPlanDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  checkpoints: number;
  features: string[];
  position: number;
  isActive: boolean;
}

/** One graded checklist line within a report. */
export interface InspectionReportItemDto {
  id: string;
  category: string;
  label: string;
  result: InspectionItemResult;
  score: number | null;
  comment: string | null;
}

/** A photo captured during the inspection. */
export interface InspectionPhotoDto {
  id: string;
  url: string;
  caption: string | null;
}

/** The finished report attached to a request. */
export interface InspectionReportDto {
  id: string;
  overallScore: number;
  grade: string | null;
  verdict: InspectionVerdict;
  summary: string | null;
  imei: string | null;
  ptaApproved: boolean | null;
  batteryHealth: number | null;
  isPublished: boolean;
  publishedAt: string | null;
  items: InspectionReportItemDto[];
  photos: InspectionPhotoDto[];
  createdAt: string;
}

/** Lightweight reference to the listing being inspected. */
export interface InspectionListingRef {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  price: number;
  currency: string;
}

/** A named party (requester / inspector) on a request. */
export interface InspectionParty {
  id: string;
  name: string;
}

/** A full inspection request with its (optional) report. */
export interface InspectionRequestDto {
  id: string;
  status: InspectionStatus;
  listing: InspectionListingRef | null;
  planName: string | null;
  feeAmount: number;
  currency: string;
  paymentStatus: InspectionPaymentStatus;
  paymentMethod: PaymentMethod | null;
  /** ISO timestamp when paid, else null. */
  paidAt: string | null;
  /** Free-text phone description when the request isn't tied to a listing. */
  deviceInfo: string | null;
  contactName: string | null;
  contactPhone: string | null;
  city: string | null;
  area: string | null;
  address: string | null;
  notes: string | null;
  preferredAt: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  cancelReason: string | null;
  requester: InspectionParty;
  inspector: InspectionParty | null;
  report: InspectionReportDto | null;
  createdAt: string;
}
