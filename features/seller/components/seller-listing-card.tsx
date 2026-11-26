"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  Eye,
  Heart,
  Loader2,
  MoreVertical,
  RotateCcw,
  ShoppingBag,
  Smartphone,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { LISTING_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatPrice, formatRelativeTime } from "@/utils/format";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SellerListingRow } from "@/features/seller/types";
import { ListingStatusBadge } from "@/features/seller/components/listing-status-badge";
import { ProductImageCarousel } from "@/features/marketplace/components/product-image-carousel";
import { ModelUploader } from "@/features/listings/components/model-uploader";
import type { UploadedModel } from "@/features/listings/schemas/create-listing";
import {
  deleteListingAction,
  markListingActiveAction,
  markListingSoldAction,
  removeListingModelAction,
  saveListingModelAction,
} from "@/features/seller/actions/seller.actions";

type ActionResult = { ok: boolean; error?: string };

export function SellerListingCard({ listing }: { listing: SellerListingRow }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [modelManagerOpen, setModelManagerOpen] = React.useState(false);
  const [draftModel, setDraftModel] = React.useState<UploadedModel | null>(
    listing.model3d ?? null,
  );

  async function run(action: () => Promise<ActionResult>, successMessage: string) {
    setPending(true);
    const result = await action();
    setPending(false);
    if (!result.ok) {
      toast.error(result.error ?? "Action failed.");
      return false;
    }
    toast.success(successMessage);
    router.refresh();
    return true;
  }

  async function persistModel(model: UploadedModel | null) {
    const saved = await run(
      () =>
        model
          ? saveListingModelAction({ listingId: listing.id, model })
          : removeListingModelAction({ listingId: listing.id }),
      model ? "3D model saved" : "3D model removed",
    );
    if (saved) setModelManagerOpen(false);
  }

  const isActive = listing.status === LISTING_STATUSES.ACTIVE;
  const isSold = listing.status === LISTING_STATUSES.SOLD;
  const thumbImages = listing.imageUrls?.length
    ? listing.imageUrls
    : listing.imageUrl
      ? [listing.imageUrl]
      : [];

  return (
    <article className="bg-card rounded-xl border p-3">
      <div className="flex gap-3">
        <Link
          href={`/listings/${listing.slug}`}
          className="relative size-20 shrink-0 overflow-hidden rounded-lg"
        >
          <ProductImageCarousel
            images={thumbImages}
            title={listing.title}
            showControls={false}
            className="bg-muted size-20 rounded-lg"
            fallback={
              <div className="text-muted-foreground grid h-full place-items-center">
                <Smartphone className="size-7" />
              </div>
            }
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/listings/${listing.slug}`}
              className="hover:text-primary line-clamp-1 font-medium"
            >
              {listing.title}
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    aria-label="Listing actions"
                    disabled={pending}
                  />
                }
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <MoreVertical className="size-4" />
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href={`/listings/${listing.slug}`} />}>
                  <Eye className="size-4" />
                  View listing
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    if (!modelManagerOpen) setDraftModel(listing.model3d ?? null);
                    setModelManagerOpen((open) => !open);
                  }}
                >
                  <Box className="size-4" />
                  {listing.model3d ? "Replace/remove 3D model" : "Add optional 3D model"}
                </DropdownMenuItem>

                {!isSold ? (
                  <DropdownMenuItem
                    onClick={() =>
                      run(
                        () => markListingSoldAction({ listingId: listing.id }),
                        "Marked as sold",
                      )
                    }
                  >
                    <ShoppingBag className="size-4" />
                    Mark as sold
                  </DropdownMenuItem>
                ) : null}

                {!isActive ? (
                  <DropdownMenuItem
                    onClick={() =>
                      run(
                        () => markListingActiveAction({ listingId: listing.id }),
                        "Listing is active again",
                      )
                    }
                  >
                    <RotateCcw className="size-4" />
                    {isSold ? "Relist" : "Mark active"}
                  </DropdownMenuItem>
                ) : null}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    if (!window.confirm("Delete this listing? This can't be undone.")) return;
                    void run(
                      () => deleteListingAction({ listingId: listing.id }),
                      "Listing deleted",
                    );
                  }}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-primary mt-0.5 font-bold">
            {formatPrice(listing.price, { currency: listing.currency })}
          </p>

          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <ListingStatusBadge status={listing.status} />
            <span className="flex items-center gap-1">
              <Eye className="size-3.5" />
              {listing.views.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="size-3.5" />
              {listing.favorites.toLocaleString()}
            </span>
            <span className={cn("ml-auto")}>
              {isSold && listing.soldAt
                ? `Sold ${formatRelativeTime(listing.soldAt)}`
                : formatRelativeTime(listing.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {modelManagerOpen ? (
        <div className="mt-3 space-y-3 border-t pt-3" data-listing-model-manager>
          <ModelUploader
            value={draftModel}
            onChange={setDraftModel}
            sourceImages={listing.sourceImages ?? []}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => void persistModel(draftModel)}
            >
              {draftModel ? "Save 3D model" : "Remove 3D model"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setDraftModel(listing.model3d ?? null);
                setModelManagerOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
