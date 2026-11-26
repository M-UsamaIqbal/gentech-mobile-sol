"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { setFavoriteAction } from "@/features/favorites/actions/favorite.actions";
import { trackToggleFavorite } from "@/features/analytics/lib/events";

export function FavoriteButton({
  listingId,
  initialIsFavorite = false,
  isAuthenticated,
  className,
}: {
  listingId: string;
  initialIsFavorite?: boolean;
  isAuthenticated: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [active, setActive] = React.useState(initialIsFavorite);
  const [pending, setPending] = React.useState(false);

  async function toggleFavorite(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      router.push(ROUTES.signIn);
      return;
    }

    const next = !active;
    setPending(true);
    setActive(next);
    const result = await setFavoriteAction({ listingId, favorite: next });
    setPending(false);
    if (!result.ok) {
      setActive(!next);
      toast.error(result.error);
      return;
    }
    trackToggleFavorite(listingId, next);
    router.refresh();
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Save to favorites"}
      aria-busy={pending}
      disabled={pending}
      onClick={toggleFavorite}
      className={cn(
        "bg-background/80 hover:bg-background grid size-11 place-items-center rounded-full backdrop-blur transition-colors disabled:opacity-70 sm:size-9",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-4.5 transition-colors",
          active ? "fill-red-500 text-red-500" : "text-foreground",
        )}
      />
    </button>
  );
}
