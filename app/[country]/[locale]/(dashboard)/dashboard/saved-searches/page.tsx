import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookmarkX } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/session";
import { getSavedSearches } from "@/features/saved-searches/services/saved-search.service";
import { SavedSearchList } from "@/features/saved-searches/components/saved-search-list";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { 
  title: "Saved Searches",
  robots: { index: false, follow: false },
};

export default async function SavedSearchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  const searches = await getSavedSearches(user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Saved Searches</h1>
        <p className="text-muted-foreground text-sm">
          {searches.length} {searches.length === 1 ? "saved search" : "saved searches"}
        </p>
      </header>

      {searches.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <BookmarkX className="text-muted-foreground size-10" />
          <p className="text-muted-foreground text-sm">
            You haven&apos;t saved any searches yet. Save a search from the marketplace to get
            back to it in one tap.
          </p>
          <Link href={ROUTES.marketplace} className={cn(buttonVariants({ variant: "outline" }))}>
            Browse the marketplace
          </Link>
        </div>
      ) : (
        <SavedSearchList items={searches} />
      )}
    </div>
  );
}
