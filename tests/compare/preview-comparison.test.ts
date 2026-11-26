import { describe, expect, it } from "vitest";

import { Region } from "@/lib/generated/prisma/enums";
import {
  getDemoListingCardsByIds,
  withDemoListingsForIds,
} from "@/features/listings/data/demo-source";
import { getDemoRelated } from "@/features/listings/data/demo-detail";
import type { ListingCardData } from "@/types/marketplace";

describe("preview-mode comparison", () => {
  it("resolves demo listing ids only within the requested region", () => {
    const cards = getDemoListingCardsByIds(["bh-l1", "pk-l1", "bh-l2"], Region.BAHRAIN);

    expect(cards.map((card) => card.id)).toEqual(["bh-l1", "bh-l2"]);
  });

  it("keeps demo suggestions region-scoped and excludes the current listing", () => {
    const related = getDemoRelated("smartphones", "bh-l1", Region.BAHRAIN, 8);

    expect(related.length).toBeGreaterThan(0);
    expect(related.every((card) => !card.id.startsWith("pk-"))).toBe(true);
    expect(related.some((card) => card.id === "bh-l1")).toBe(false);
  });

  it("fills every unresolved id when a selection mixes live and demo listings", () => {
    const live = [{ id: "db-l1" } as ListingCardData];
    const merged = withDemoListingsForIds(
      live,
      ["bh-l1", "db-l1", "bh-l2"],
      Region.BAHRAIN,
    );

    expect(merged.map((card) => card.id)).toEqual(["db-l1", "bh-l1", "bh-l2"]);
  });
});
