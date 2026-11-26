"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { INSPECTION_KINDS, INSPECTION_KIND_LABELS, ROUTES } from "@/lib/constants";
import { formatPrice } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { RequestInspectionForm } from "@/features/inspections/components/request-inspection-form";
import { inspectionKindForCategory } from "@/features/inspections/lib/inspection-kind";
import type { InspectionPlanDto } from "@/features/inspections/types";
import type { LocationTree } from "@/features/locations/services/location.service";

interface Props {
  listingId: string;
  plans: InspectionPlanDto[];
  isAuthenticated: boolean;
  defaultCity?: string;
  locations: LocationTree;
  showPakistanSignals?: boolean;
  categorySlug?: string | null;
}

/** Sidebar card on the listing detail page — the buyer's entry point to inspections. */
export function ListingInspectionCta({
  listingId,
  plans,
  isAuthenticated,
  defaultCity,
  locations,
  showPakistanSignals = false,
  categorySlug,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const fromPrice = plans.length > 0 ? Math.min(...plans.map((p) => p.price)) : null;
  const currency = plans[0]?.currency ?? "PKR";
  const isLaptop = inspectionKindForCategory(categorySlug) === INSPECTION_KINDS.LAPTOP;
  const deviceLabel =
    INSPECTION_KIND_LABELS[isLaptop ? INSPECTION_KINDS.LAPTOP : INSPECTION_KINDS.PHONE].toLowerCase();

  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
          <ShieldCheck className="size-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold">Not sure about this {deviceLabel}?</h3>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {isLaptop
              ? "Get it checked by a certified GenTech inspector before you buy — display, keyboard, performance, battery and more."
              : `Get it checked by a certified GenTech inspector before you buy — battery, IMEI,${showPakistanSignals ? " PTA," : ""} cameras and more.`}
          </p>
        </div>
      </div>

      {fromPrice !== null ? (
        <p className="text-muted-foreground mt-3 text-sm">
          From <span className="text-foreground font-semibold">{formatPrice(fromPrice, { currency })}</span>
        </p>
      ) : null}

      {!isAuthenticated ? (
        <Button variant="outline" className="mt-3 w-full" render={<Link href={ROUTES.signIn} />}>
          Sign in to request an inspection
        </Button>
      ) : open ? (
        <div className="mt-4">
          <RequestInspectionForm
            listingId={listingId}
            plans={plans}
            defaultCity={defaultCity}
            locations={locations}
          />
        </div>
      ) : (
        <Button className="mt-3 w-full" onClick={() => setOpen(true)}>
          <ShieldCheck className="size-4" />
          Request an inspection
        </Button>
      )}
    </div>
  );
}
