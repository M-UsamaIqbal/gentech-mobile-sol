import { CalendarDays, MapPin, ShieldCheck, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ListingSeller } from "@/types/marketplace";
import { ContactSeller } from "./contact-seller";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("") || "S"
  );
}

export function SellerCard({
  seller,
  listingId,
  listingTitle,
  isAuthenticated,
}: {
  seller: ListingSeller;
  listingId: string;
  listingTitle: string;
  isAuthenticated: boolean;
}) {
  const memberSinceYear = seller.memberSince
    ? new Date(seller.memberSince).getFullYear()
    : undefined;

  return (
    <div className="bg-card rounded-xl border p-4">
      <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase">Seller</p>

      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          {seller.image ? <AvatarImage src={seller.image} alt={seller.name} /> : null}
          <AvatarFallback>{initials(seller.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="flex items-center gap-1 font-semibold">
            {seller.name}
            <ShieldCheck className="size-4 text-sky-500" aria-label="Verified seller" />
          </p>
          {typeof seller.rating === "number" ? (
            <p className="text-muted-foreground flex items-center gap-1 text-sm">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {seller.rating.toFixed(1)}
              {typeof seller.reviewCount === "number" ? <span>({seller.reviewCount})</span> : null}
            </p>
          ) : null}
        </div>
      </div>

      <dl className="text-muted-foreground mt-4 space-y-1.5 text-sm">
        {seller.city ? (
          <div className="flex items-center gap-2">
            <MapPin className="size-4" />
            {seller.city}
          </div>
        ) : null}
        {memberSinceYear ? (
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4" />
            Member since {memberSinceYear}
          </div>
        ) : null}
      </dl>

      <div className="mt-4">
        <ContactSeller
          listingId={listingId}
          listingTitle={listingTitle}
          phone={seller.phone}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
}
