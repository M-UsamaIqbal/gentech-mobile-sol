"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestInspectionAction } from "@/features/inspections/actions/inspection.actions";
import { PhoneVerificationField } from "@/features/inspections/components/phone-verification-field";
import type { InspectionPlanDto } from "@/features/inspections/types";
import type { LocationTree } from "@/features/locations/services/location.service";
import { LocationPicker, type LocationSelection } from "@/features/locations/components/location-picker";

interface Props {
  listingId: string;
  plans: InspectionPlanDto[];
  defaultCity?: string;
  locations: LocationTree;
}

export function RequestInspectionForm({ listingId, plans, defaultCity, locations }: Props) {
  const router = useRouter();
  const [planId, setPlanId] = React.useState(plans[0]?.id ?? "");
  const [pending, setPending] = React.useState(false);
  const [location, setLocation] = React.useState<LocationSelection>(() => {
    for (const country of locations) {
      const city = country.cities.find((entry) => entry.name === defaultCity);
      if (city) return { countryId: country.id, cityId: city.id, areaId: "" };
    }
    return { countryId: "", cityId: "", areaId: "" };
  });

  // Phone (WhatsApp/SMS) OTP verification — required before requesting.
  const [phone, setPhone] = React.useState("");
  const [phoneVerified, setPhoneVerified] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!phoneVerified) {
      toast.error("Please verify your phone number before requesting.");
      return;
    }
    const form = new FormData(event.currentTarget);
    setPending(true);
    const result = await requestInspectionAction({
      listingId,
      planId,
      contactName: String(form.get("contactName") ?? ""),
      contactPhone: String(form.get("contactPhone") ?? ""),
      countryId: location.countryId,
      cityId: location.cityId,
      areaId: location.areaId || undefined,
      address: String(form.get("address") ?? "") || undefined,
      preferredAt: String(form.get("preferredAt") ?? "") || undefined,
      notes: String(form.get("notes") ?? "") || undefined,
    });
    setPending(false);

    if (result.ok) {
      toast.success("Inspection requested. We'll be in touch to schedule it.");
      router.push(ROUTES.inspections);
      router.refresh();
    } else {
      toast.error(result.error ?? "Could not request the inspection.");
    }
  }

  if (plans.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Inspection packages are not available right now. Please check back later.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Package selection */}
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">Choose a package</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {plans.map((plan) => (
            <button
              type="button"
              key={plan.id}
              onClick={() => setPlanId(plan.id)}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                planId === plan.id
                  ? "border-primary ring-primary/30 ring-2"
                  : "hover:border-primary/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="text-primary size-4" />
                  {plan.name}
                </span>
                <span className="font-semibold">
                  {formatPrice(plan.price, { currency: plan.currency })}
                </span>
              </div>
              {plan.description ? (
                <p className="text-muted-foreground mt-1 text-xs">{plan.description}</p>
              ) : null}
              <p className="text-muted-foreground mt-1 text-xs">{plan.checkpoints}+ checkpoints</p>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contactName">Your name</Label>
          <Input id="contactName" name="contactName" required maxLength={80} />
        </div>
        <div className="sm:col-span-2">
          <PhoneVerificationField
            phone={phone}
            onPhoneChange={setPhone}
            verified={phoneVerified}
            onVerifiedChange={setPhoneVerified}
          />
        </div>
        <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
          <LocationPicker
            locations={locations}
            prefix="inspection-request-location"
            value={location}
            onChange={setLocation}
          />
          <input type="hidden" name="countryId" value={location.countryId} />
          <input type="hidden" name="cityId" value={location.cityId} />
          <input type="hidden" name="areaId" value={location.areaId} />
          {locations.length === 0 ? (
            <p className="text-muted-foreground text-sm sm:col-span-3">
              Locations are temporarily unavailable. Please try again later.
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Meeting address (optional)</Label>
        <Input id="address" name="address" maxLength={300} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="preferredAt">Preferred date & time (optional)</Label>
        <Input id="preferredAt" name="preferredAt" type="datetime-local" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes for the inspector (optional)</Label>
        <Textarea id="notes" name="notes" rows={3} maxLength={1000} />
      </div>

      <Button type="submit" disabled={pending || !phoneVerified} className="w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
        {pending ? "Submitting…" : "Request inspection"}
      </Button>
      {!phoneVerified ? (
        <p className="text-muted-foreground text-center text-xs">
          Verify your phone number above to enable this.
        </p>
      ) : null}
      <p className="text-muted-foreground text-center text-xs">
        Payment is collected after we confirm your slot. You can cancel any time before the visit.
      </p>
    </form>
  );
}
