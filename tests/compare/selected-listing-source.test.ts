import { beforeEach, describe, expect, it, vi } from "vitest";

import { Region } from "@/lib/generated/prisma/enums";

const mocks = vi.hoisted(() => ({
  findByIds: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/features/listings/repositories/listing.repository", () => ({
  getListingCardsByIds: mocks.findByIds,
}));

import { getDemoListings } from "@/features/marketplace/data/fixtures";
import { getSelectedListingCards } from "@/features/listings/services/listing.service";

describe("getSelectedListingCards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns exact database rows in the marketplace path", async () => {
    const record = getDemoListings(Region.PAKISTAN)[0]!;
    mocks.findByIds.mockResolvedValue([record]);

    await expect(getSelectedListingCards([record.id], Region.PAKISTAN)).resolves.toEqual([
      record,
    ]);
    expect(mocks.findByIds).toHaveBeenCalledWith([record.id], Region.PAKISTAN);
  });

  it("falls back to the same region-scoped preview source when the database fails", async () => {
    mocks.findByIds.mockRejectedValue(new Error("DB offline"));

    const pk = getDemoListings(Region.PAKISTAN)[0]!;
    const bh = getDemoListings(Region.BAHRAIN)[0]!;

    await expect(getSelectedListingCards([pk.id], Region.PAKISTAN)).resolves.toEqual([pk]);
    await expect(getSelectedListingCards([pk.id], Region.BAHRAIN)).resolves.toEqual([]);
    await expect(getSelectedListingCards([bh.id], Region.BAHRAIN)).resolves.toEqual([bh]);
  });

  it("does not query data access with an empty selection", async () => {
    await expect(getSelectedListingCards([], Region.PAKISTAN)).resolves.toEqual([]);
    expect(mocks.findByIds).not.toHaveBeenCalled();
  });
});
