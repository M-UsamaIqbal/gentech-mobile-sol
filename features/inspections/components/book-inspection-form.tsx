"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { PK_CITIES, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bookInspectionAction } from "@/features/inspections/actions/inspection.actions";
import { PhoneVerificationField } from "@/features/inspections/components/phone-verification-field";
import type { InspectionPlanDto } from "@/features/inspections/types";

interface Props {
  plans: InspectionPlanDto[];
  isAuthenticated: boolean;
  /** Optional pre-selected package (e.g. clicked from a pricing card). */
  initialPlanId?: string;
}

/** PakWheels-style booking form — describe the phone + your details, pick a package. */
export function BookInspectionForm({ plans, isAuthenticated, initialPlanId }: Props) {
  const router = useRouter();
  const [planId, setPlanId] = React.useState(initialPlanId ?? plans[0]?.id ?? "");
  const [pending, setPending] = React.useState(false);

  // Phone (WhatsApp/SMS) OTP verification — required before booking.
  const [phone, setPhone] = React.useState("");
  const [phoneVerified, setPhoneVerified] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!phoneVerified) {
      toast.error("Please verify your phone number before booking.");
      return;
    }
    const form = new FormData(event.currentTarget);
    setPending(true);
    const result = await bookInspectionAction({
      planId,
      deviceInfo: String(form.get("deviceInfo") ?? ""),
      contactName: String(form.get("contactName") ?? ""),
      contactPhone: String(form.get("contactPhone") ?? ""),
      city: String(form.get("city") ?? ""),
      area: String(form.get("area") ?? "") || undefined,
      address: String(form.get("address") ?? "") || undefined,
      preferredAt: String(form.get("preferredAt") ?? "") || undefined,
      notes: String(form.get("notes") ?? "") || undefined,
    });
    setPending(false);

    if (result.ok) {
      toast.success("Inspection booked! We'll call you to confirm the slot.");
      router.push(ROUTES.inspections);
      router.refresh();
    } else {
      toast.error(result.error ?? "Could not book the inspection.");
    }
  }

  if (plans.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Inspection packages are not available right now. Please check back later.
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-card rounded-xl border p-6 text-center">
        <ShieldCheck className="text-primary mx-auto size-8" />
        <p className="mt-3 font-medium">Sign in to book an inspection</p>
        <p className="text-muted-foreground mt-1 text-sm">
          You&apos;ll need an account so we can share your report and updates.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href={ROUTES.signIn} className={cn(buttonVariants())}>
            Sign in
          </Link>
          <Link href={ROUTES.signUp} className={cn(buttonVariants({ variant: "outline" }))}>
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card space-y-6 rounded-2xl border p-5 sm:p-6">
      {/* Step 1 — package */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">1. Choose a package</legend>
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

      {/* Step 2 — phone */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">2. Which phone should we inspect?</legend>
        <div className="space-y-1.5">
          <Label htmlFor="deviceInfo">Phone make & model</Label>
          <div className="relative">
            <Smartphone className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="deviceInfo"
              name="deviceInfo"
              required
              maxLength={120}
              placeholder="e.g. iPhone 14 Pro 256GB, or Samsung S23 Ultra"
              className="pl-9"
            />
          </div>
        </div>
      </fieldset>

      {/* Step 3 — contact + location */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">3. Your details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contactName">Full name</Label>
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
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <select
              id="city"
              name="city"
              required
              defaultValue=""
              className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
            >
              <option value="" disabled>
                Select a city
              </option>
              {PK_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="area">Area (optional)</Label>
            <Input id="area" name="area" maxLength={120} placeholder="e.g. Gulberg, DHA" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Meeting address (optional)</Label>
          <Input id="address" name="address" maxLength={300} />
        </div>
      </fieldset>

      {/* Step 4 — schedule */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">4. When works for you?</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="preferredAt">Preferred date & time (optional)</Label>
            <Input id="preferredAt" name="preferredAt" type="datetime-local" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Anything else? (optional)</Label>
          <Textarea id="notes" name="notes" rows={3} maxLength={1000} />
        </div>
      </fieldset>

      <Button type="submit" disabled={pending || !phoneVerified} className="w-full sm:w-auto">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
        {pending ? "Booking…" : "Book inspection"}
      </Button>
      {!phoneVerified ? (
        <p className="text-muted-foreground text-xs">
          Verify your phone number above to enable booking.
        </p>
      ) : null}
      <p className="text-muted-foreground text-xs">
        No payment now — we confirm your slot first, then collect the fee at inspection.
      </p>
    </form>
  );
}
