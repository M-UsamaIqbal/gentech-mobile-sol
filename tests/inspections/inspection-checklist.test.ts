import { describe, expect, it } from "vitest";

import {
  INSPECTION_CHECKLIST,
  INSPECTION_KINDS,
  LAPTOP_INSPECTION_CHECKLIST,
  getInspectionChecklist,
} from "@/lib/constants";
import {
  inspectionKindForCategory,
  resolveInspectionKind,
} from "@/features/inspections/lib/inspection-kind";

describe("inspection checklists", () => {
  it("keeps the phone checklist intact", () => {
    const labels = INSPECTION_CHECKLIST.flatMap((group) => group.items);
    expect(INSPECTION_CHECKLIST).toHaveLength(7);
    expect(labels).toContain("IMEI check");
    expect(labels).toContain("PTA approval");
    expect(labels).toContain("iCloud / account lock");
  });

  it("provides a distinct laptop checklist without phone identity checks", () => {
    const labels = LAPTOP_INSPECTION_CHECKLIST.flatMap((group) => group.items);
    const categories = LAPTOP_INSPECTION_CHECKLIST.map((group) => group.category);

    expect(categories).toContain("Chassis & Keyboard");
    expect(categories).toContain("Performance");
    expect(categories).toContain("Ports & Connectivity");
    expect(labels).toContain("Keyboard (all keys)");
    expect(labels).toContain("Trackpad & gestures");
    expect(labels).toContain("Storage health");
    for (const phoneOnly of ["IMEI check", "PTA approval", "iCloud / account lock"]) {
      expect(labels).not.toContain(phoneOnly);
    }
  });

  it("returns the checklist matching the requested device family", () => {
    expect(getInspectionChecklist(INSPECTION_KINDS.PHONE)).toBe(INSPECTION_CHECKLIST);
    expect(getInspectionChecklist(INSPECTION_KINDS.LAPTOP)).toBe(LAPTOP_INSPECTION_CHECKLIST);
  });
});

describe("inspection kind resolution", () => {
  it("maps laptop and mixed laptop categories to the laptop checklist", () => {
    expect(inspectionKindForCategory("laptops")).toBe(INSPECTION_KINDS.LAPTOP);
    expect(inspectionKindForCategory("laptops-tablets")).toBe(INSPECTION_KINDS.LAPTOP);
  });

  it("keeps phone and tablet categories on the phone checklist", () => {
    expect(inspectionKindForCategory("smartphones")).toBe(INSPECTION_KINDS.PHONE);
    expect(inspectionKindForCategory("tablets")).toBe(INSPECTION_KINDS.PHONE);
    expect(inspectionKindForCategory("laptop-accessories")).toBe(INSPECTION_KINDS.PHONE);
    expect(inspectionKindForCategory()).toBe(INSPECTION_KINDS.PHONE);
    expect(inspectionKindForCategory("unknown-category")).toBe(INSPECTION_KINDS.PHONE);
  });

  it("prefers an explicit stored kind over the listing category", () => {
    expect(resolveInspectionKind("LAPTOP", "smartphones")).toBe(INSPECTION_KINDS.LAPTOP);
    expect(resolveInspectionKind("PHONE", "laptops")).toBe(INSPECTION_KINDS.PHONE);
  });

  it("falls back to the listing category for legacy requests", () => {
    expect(resolveInspectionKind(null, "laptops")).toBe(INSPECTION_KINDS.LAPTOP);
    expect(resolveInspectionKind(undefined, "smartphones")).toBe(INSPECTION_KINDS.PHONE);
  });
});
