import Link from "next/link";
import { MapPin, Smartphone } from "lucide-react";

import { cn } from "@/lib/utils";
import { LISTING_CONDITION_LABELS } from "@/lib/constants";
import { formatPrice, formatRelativeTime } from "@/utils/format";
import type { ListingCardData } from "@/types/marketplace";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "./favorite-button";

/** Deterministic gradient per listing so the demo tiles look varied but stable. */
const GRADIENTS = [
  "from-violet-500/20 to-fuchsia-500/20",
  "from-sky-500/20 to-cyan-500/20",
  "from-emerald-500/20 to-teal-500/20",
  "from-amber-500/20 to-orange-500/20",
  "from-rose-500/20 to-pink-500/20",
  "from-indigo-500/20 to-blue-500/20",
];

function gradientFor(id: string): string {
  const sum = [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return GRADIENTS[sum % GRADIENTS.length]!;
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const href = `/listings/${listing.slug}`;

  return (
    <article className="group bg-card relative overflow-hidden rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <Link href={href} className="block">
        {/* Thumbnail */}
        <div
          className={cn(
            "relative aspect-4/3 w-full overflow-hidden bg-gradient-to-br",
            gradientFor(listing.id),
          )}
        >
          {listing.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="text-foreground/30 flex h-full flex-col items-center justify-center gap-2">
              <Smartphone className="size-10" />
              {listing.brand ? (
                <span className="text-foreground/50 text-sm font-medium">{listing.brand}</span>
              ) : null}
            </div>
          )}

          {listing.isFeatured ? (
            <Badge className="absolute top-2 left-2 bg-amber-500 text-white hover:bg-amber-500">
              Featured
            </Badge>
          ) : null}
        </div>

        {/* Body */}
        <div className="space-y-2 p-3">
          <p className="text-primary text-base font-bold">
            {formatPrice(listing.price, { currency: listing.currency })}
          </p>
          <h3 className="group-hover:text-primary line-clamp-2 text-sm leading-snug font-medium transition-colors">
            {listing.title}
          </h3>

          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Badge variant="secondary" className="font-normal">
              {LISTING_CONDITION_LABELS[listing.condition]}
            </Badge>
            <span className="flex items-center gap-1 truncate">
              <MapPin className="size-3 shrink-0" />
              {listing.city}
            </span>
          </div>

          <p className="text-muted-foreground text-xs">{formatRelativeTime(listing.createdAt)}</p>
        </div>
      </Link>

      <FavoriteButton className="absolute top-2 right-2" />
    </article>
  );
}
