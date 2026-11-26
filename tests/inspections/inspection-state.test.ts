import { describe, expect, it } from "vitest";

import {
  INSPECTION_PAYMENT_STATUSES,
  INSPECTION_STATUSES,
  type InspectionStatus,
} from "@/lib/constants";
import {
  canClaimInspection,
  canScheduleInspection,
  canSubmitInspectionReport,
  isInspectionFeePaid,
} from "@/features/inspections/lib/inspection-state";
import { maskReportImei } from "@/features/inspections/lib/imei";

const OPEN_STATUSES: InspectionStatus[] = [
  INSPECTION_STATUSES.REQUESTED,
  INSPECTION_STATUSES.PAYMENT_PENDING,
  INSPECTION_STATUSES.SCHEDULED,
];
const TERMINAL_STATUSES: InspectionStatus[] = [
  INSPECTION_STATUSES.COMPLETED,
  INSPECTION_STATUSES.CANCELLED,
  INSPECTION_STATUSES.EXPIRED,
];

describe("inspection claim rules", () => {
  it.each(OPEN_STATUSES)("allows claiming a %s request", (status) => {
    expect(canClaimInspection(status)).toBe(true);
  });

  it.each([...TERMINAL_STATUSES, INSPECTION_STATUSES.IN_PROGRESS])(
    "refuses to claim a %s request",
    (status) => {
      expect(canClaimInspection(status)).toBe(false);
    },
  );
});

describe("inspection scheduling rules", () => {
  it.each([...OPEN_STATUSES, INSPECTION_STATUSES.IN_PROGRESS])(
    "allows (re)scheduling a %s request",
    (status) => {
      expect(canScheduleInspection(status)).toBe(true);
    },
  );

  it.each(TERMINAL_STATUSES)("never moves a %s request back to SCHEDULED", (status) => {
    expect(canScheduleInspection(status)).toBe(false);
  });
});

describe("inspection report release rules", () => {
  it.each([...OPEN_STATUSES, INSPECTION_STATUSES.IN_PROGRESS])(
    "allows a report on a paid %s request",
    (status) => {
      expect(
        canSubmitInspectionReport({
          status,
          paymentStatus: INSPECTION_PAYMENT_STATUSES.PAID,
        }),
      ).toBe(true);
    },
  );

  it.each([
    INSPECTION_PAYMENT_STATUSES.UNPAID,
    INSPECTION_PAYMENT_STATUSES.AWAITING_CUSTOMER,
    INSPECTION_PAYMENT_STATUSES.PENDING,
    INSPECTION_PAYMENT_STATUSES.PROCESSING,
    INSPECTION_PAYMENT_STATUSES.FAILED,
    INSPECTION_PAYMENT_STATUSES.REFUNDED,
  ])("refuses to release a report while payment is %s", (paymentStatus) => {
    expect(
      canSubmitInspectionReport({
        status: INSPECTION_STATUSES.SCHEDULED,
        paymentStatus,
      }),
    ).toBe(false);
  });

  it.each(TERMINAL_STATUSES)("refuses to report on a paid %s request", (status) => {
    expect(
      canSubmitInspectionReport({
        status,
        paymentStatus: INSPECTION_PAYMENT_STATUSES.PAID,
      }),
    ).toBe(false);
  });

  it("treats only PAID as collected", () => {
    expect(isInspectionFeePaid(INSPECTION_PAYMENT_STATUSES.PAID)).toBe(true);
    expect(isInspectionFeePaid(INSPECTION_PAYMENT_STATUSES.PROCESSING)).toBe(false);
    expect(isInspectionFeePaid(INSPECTION_PAYMENT_STATUSES.REFUNDED)).toBe(false);
  });
});

describe("report IMEI masking", () => {
  it("keeps the last four digits and hides the rest", () => {
    const masked = maskReportImei("356789012345671");

    expect(masked).toBe("***********5671");
    expect(masked).toHaveLength(15);
    expect(masked?.endsWith("5671")).toBe(true);
    expect(masked).not.toContain("3567890123456");
  });

  it("returns null for missing or implausibly short values", () => {
    expect(maskReportImei(null)).toBeNull();
    expect(maskReportImei("")).toBeNull();
    expect(maskReportImei("1234")).toBeNull();
  });
});
