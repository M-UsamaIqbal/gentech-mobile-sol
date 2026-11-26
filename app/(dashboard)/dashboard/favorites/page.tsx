import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { getFavoriteListings } from "@/features/favorites/services/favorite.service";
import { ListingsGrid } from "@/features/marketplace/components/listings-grid";

export const metadata: Metadata = {
  title: "Favorites",
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  const listings = await getFavoriteListings(user.id);
  const favoriteIds = listings.map((listing) => listing.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Heart className="size-6 text-rose-500" />
          Favorites
        </h1>
        <p className="text-muted-foreground text-sm">
          {listings.length} {listings.length === 1 ? "saved listing" : "saved listings"}
        </p>
      </header>

      <ListingsGrid
        listings={listings}
        favoriteIds={favoriteIds}
        isAuthenticated
        emptyMessage="No favorites yet. Tap the heart on a listing to save it here."
      />
    </div>
  );
}
