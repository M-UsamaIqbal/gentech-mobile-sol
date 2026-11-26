import {
  INSPECTION_PAYMENT_STATUSES,
  INSPECTION_STATUSES,
  type InspectionPaymentStatus,
  type InspectionStatus,
} from "@/lib/constants";

/**
 * States in which an inspector may claim an unassigned request. Terminal states
 * are excluded so a cancelled or expired request can never be picked up.
 */
export const CLAIMABLE_STATUSES: readonly InspectionStatus[] = [
  INSPECTION_STATUSES.REQUESTED,
  INSPECTION_STATUSES.PAYMENT_PENDING,
  INSPECTION_STATUSES.SCHEDULED,
];

/**
 * States in which an assigned inspector may (re)schedule a slot. COMPLETED,
 * CANCELLED and EXPIRED are excluded so a finished request can never regress
 * back to SCHEDULED.
 */
export const SCHEDULABLE_STATUSES: readonly InspectionStatus[] = [
  ...CLAIMABLE_STATUSES,
  INSPECTION_STATUSES.IN_PROGRESS,
];

/** True once the inspection fee has actually been collected. */
export function isInspectionFeePaid(paymentStatus: InspectionPaymentStatus): boolean {
  return paymentStatus === INSPECTION_PAYMENT_STATUSES.PAID;
}

export function canClaimInspection(status: InspectionStatus): boolean {
  return CLAIMABLE_STATUSES.includes(status);
}

export function canScheduleInspection(status: InspectionStatus): boolean {
  return SCHEDULABLE_STATUSES.includes(status);
}

/**
 * A graded report may only be filed while the request is still open and after
 * the fee is paid — the marketplace never delivers a paid inspection for free.
 * Callers must additionally verify the request is assigned to the inspector.
 */
export function canSubmitInspectionReport(input: {
  status: InspectionStatus;
  paymentStatus: InspectionPaymentStatus;
}): boolean {
  return (
    SCHEDULABLE_STATUSES.includes(input.status) &&
    isInspectionFeePaid(input.paymentStatus)
  );
}
