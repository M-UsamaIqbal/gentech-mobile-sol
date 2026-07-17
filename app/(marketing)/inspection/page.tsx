import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ClipboardCheck, ScanLine, ShieldCheck } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import { formatPrice } from "@/utils/format";
import { getCurrentUser } from "@/lib/session";
import { getInspectionPlans } from "@/features/inspections/services/inspection.service";
import { BookInspectionForm } from "@/features/inspections/components/book-inspection-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Phone Inspection Service",
  description:
    "Buy used phones with confidence. Book a certified GenTech inspector to physically verify any phone — battery, IMEI, PTA, cameras and 40+ checkpoints.",
};

const STEPS = [
  {
    icon: ClipboardCheck,
    title: "Book an inspection",
    body: "Tell us which phone to check and pick a package — right here, or from any listing.",
  },
  {
    icon: ScanLine,
    title: "We inspect the phone",
    body: "A certified inspector meets the seller and runs a full physical + software check.",
  },
  {
    icon: ShieldCheck,
    title: "Get a graded report",
    body: "Receive a detailed, graded report with photos and a clear buy recommendation.",
  },
];

export default async function InspectionServicePage() {
  const [plans, user] = await Promise.all([getInspectionPlans(), getCurrentUser()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Hero */}
      <section className="text-center">
        <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium">
          <ShieldCheck className="size-4" />
          GenTech Certified Inspection
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Buy used phones with total confidence
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-2xl">
          Not sure about a phone you found? Let a certified inspector verify its condition, battery
          health, IMEI and PTA status before you pay — so there are no surprises.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button render={<Link href="#book" />}>Book an inspection</Button>
          <Button variant="outline" render={<Link href={ROUTES.inspections} />}>
            My inspections
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-bold tracking-tight">How it works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.title} className="bg-card rounded-xl border p-5 text-center">
              <div className="bg-primary/10 text-primary mx-auto grid size-11 place-items-center rounded-xl">
                <step.icon className="size-6" />
              </div>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mt-16">
        <h2 className="text-center text-2xl font-bold tracking-tight">Inspection packages</h2>
        <p className="text-muted-foreground mt-2 text-center text-sm">
          Pick a package below or when booking — pay only after we confirm your slot.
        </p>

        {plans.length === 0 ? (
          <p className="text-muted-foreground mt-8 text-center text-sm">
            Packages are being updated. Please check back soon.
          </p>
        ) : (
          <div className="mx-auto mt-8 grid max-w-3xl gap-6 sm:grid-cols-2">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className={
                  "bg-card relative rounded-2xl border p-6" +
                  (index === plans.length - 1 ? " border-primary ring-primary/20 ring-2" : "")
                }
              >
                {index === plans.length - 1 ? (
                  <span className="bg-primary text-primary-foreground absolute -top-3 left-6 rounded-full px-3 py-0.5 text-xs font-medium">
                    Most popular
                  </span>
                ) : null}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {plan.description ? (
                  <p className="text-muted-foreground mt-1 text-sm">{plan.description}</p>
                ) : null}
                <p className="mt-4 text-3xl font-bold">
                  {formatPrice(plan.price, { currency: plan.currency })}
                </p>
                <p className="text-muted-foreground text-xs">{plan.checkpoints}+ checkpoints</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" render={<Link href="#book" />}>
                  Book this package
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Booking form */}
      <section id="book" className="mt-16 scroll-mt-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold tracking-tight">Book your inspection</h2>
          <p className="text-muted-foreground mt-2 mb-6 text-center text-sm">
            Fill in the details and we&apos;ll arrange a certified inspector.
          </p>
          <BookInspectionForm plans={plans} isAuthenticated={Boolean(user)} />
        </div>
      </section>
    </div>
  );
}
