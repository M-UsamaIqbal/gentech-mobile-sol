import { getServerTranslations } from "@/lib/i18n/get-server-translations";

import type { ListingCardData } from "@/types/marketplace";
import { ListingCard } from "./listing-card";

export async function ListingsGrid({
  listings,
  favoriteIds = [],
  isAuthenticated = false,
  emptyMessage,
}: {
  listings: ListingCardData[];
  favoriteIds?: string[];
  isAuthenticated?: boolean;
  emptyMessage?: string;
}) {
  const t = await getServerTranslations("marketplace");

  if (listings.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
        {emptyMessage ?? t("noListings")}
      </p>
    );
  }

  const favorites = new Set(favoriteIds);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          isFavorite={favorites.has(listing.id)}
          isAuthenticated={isAuthenticated}
        />
      ))}
    </div>
  );
}
