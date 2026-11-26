import { describe, expect, it } from "vitest";

import {
  bookInspectionSchema,
  reportItemSchema,
  scheduleInspectionSchema,
  submitReportSchema,
} from "@/features/inspections/schemas/inspection";

const passItem = {
  category: "Display",
  label: "Screen scratches",
  result: "PASS" as const,
};

const baseReport = {
  requestId: "req_1",
  verdict: "RECOMMENDED" as const,
  summary: "Everything checks out.",
  imei: "356789012345671",
  ptaApproved: true,
  batteryHealth: 87,
  items: [passItem],
};

describe("submit report validation", () => {
  it("accepts a complete, graded report", () => {
    expect(submitReportSchema.safeParse(baseReport).success).toBe(true);
  });

  it("accepts a minimal report without IMEI/PTA/battery", () => {
    expect(
      submitReportSchema.safeParse({
        requestId: "req_1",
        verdict: "NOT_RECOMMENDED",
        items: [passItem],
      }).success,
    ).toBe(true);
  });

  it("requires at least one checklist item", () => {
    expect(submitReportSchema.safeParse({ ...baseReport, items: [] }).success).toBe(false);
  });

  it("rejects a report where every item is N/A", () => {
    expect(
      submitReportSchema.safeParse({
        ...baseReport,
        items: [
          { ...passItem, result: "NOT_APPLICABLE" },
          { category: "Battery", label: "Charging", result: "NOT_APPLICABLE" },
        ],
      }).success,
    ).toBe(false);
  });

  it("accepts N/A lines alongside at least one graded line", () => {
    expect(
      submitReportSchema.safeParse({
        ...baseReport,
        items: [passItem, { category: "Battery", label: "Charging", result: "NOT_APPLICABLE" }],
      }).success,
    ).toBe(true);
  });

  it("rejects unknown results and verdicts", () => {
    expect(
      submitReportSchema.safeParse({
        ...baseReport,
        items: [{ ...passItem, result: "BROKEN" }],
      }).success,
    ).toBe(false);
    expect(submitReportSchema.safeParse({ ...baseReport, verdict: "MAYBE" }).success).toBe(false);
  });

  it("rejects an out-of-range battery health", () => {
    expect(submitReportSchema.safeParse({ ...baseReport, batteryHealth: -1 }).success).toBe(false);
    expect(submitReportSchema.safeParse({ ...baseReport, batteryHealth: 101 }).success).toBe(false);
    expect(submitReportSchema.safeParse({ ...baseReport, batteryHealth: 100 }).success).toBe(true);
  });

  it("only accepts a 15-digit IMEI when one is provided", () => {
    expect(submitReportSchema.safeParse({ ...baseReport, imei: "12345" }).success).toBe(false);
    expect(
      submitReportSchema.safeParse({ ...baseReport, imei: "35678901234567A" }).success,
    ).toBe(false);
    expect(submitReportSchema.safeParse({ ...baseReport, imei: "" }).success).toBe(true);
    expect(submitReportSchema.safeParse({ ...baseReport, imei: undefined }).success).toBe(true);
  });

  it("caps the checklist size", () => {
    const tooMany = Array.from({ length: 101 }, (_, index) => ({
      ...passItem,
      label: `Item ${index}`,
    }));

    expect(submitReportSchema.safeParse({ ...baseReport, items: tooMany }).success).toBe(false);
  });

  it("rejects an over-long summary", () => {
    expect(
      submitReportSchema.safeParse({ ...baseReport, summary: "x".repeat(2001) }).success,
    ).toBe(false);
  });
});

describe("report item validation", () => {
  it("requires a category and label", () => {
    expect(reportItemSchema.safeParse({ category: "", label: "Screen", result: "PASS" }).success).toBe(
      false,
    );
    expect(reportItemSchema.safeParse({ category: "Display", label: "", result: "PASS" }).success).toBe(
      false,
    );
  });

  it("bounds the optional per-item score", () => {
    expect(reportItemSchema.safeParse({ ...passItem, score: 10 }).success).toBe(true);
    expect(reportItemSchema.safeParse({ ...passItem, score: 11 }).success).toBe(false);
    expect(reportItemSchema.safeParse({ ...passItem, score: 4.5 }).success).toBe(false);
  });
});

describe("standalone booking validation", () => {
  const booking = {
    planId: "plan-1",
    deviceInfo: "MacBook Air M3 16GB",
    inspectionKind: "LAPTOP" as const,
    contactName: "Buyer Name",
    contactPhone: "03001234567",
    countryId: "country-1",
    cityId: "city-1",
  };

  it("accepts a laptop booking", () => {
    expect(bookInspectionSchema.safeParse(booking).success).toBe(true);
  });

  it("defaults legacy bookings to a phone inspection", () => {
    const parsed = bookInspectionSchema.safeParse({
      planId: booking.planId,
      deviceInfo: booking.deviceInfo,
      contactName: booking.contactName,
      contactPhone: booking.contactPhone,
      countryId: booking.countryId,
      cityId: booking.cityId,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.inspectionKind).toBe("PHONE");
  });

  it("rejects an unknown device family", () => {
    expect(bookInspectionSchema.safeParse({ ...booking, inspectionKind: "TABLET" }).success).toBe(
      false,
    );
  });
});

describe("schedule inspection validation", () => {
  it("requires a request id and a non-empty slot", () => {
    expect(
      scheduleInspectionSchema.safeParse({
        requestId: "req_1",
        scheduledAt: "2026-12-01T10:00:00.000Z",
      }).success,
    ).toBe(true);
    expect(scheduleInspectionSchema.safeParse({ requestId: "", scheduledAt: "" }).success).toBe(
      false,
    );
  });
});
