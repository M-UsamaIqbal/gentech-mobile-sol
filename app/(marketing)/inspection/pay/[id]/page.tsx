import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import {
  INSPECTION_PAYMENT_STATUSES,
  PAYMENT_METHODS,
  ROUTES,
  type PaymentMethod,
} from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { getInspection } from "@/features/inspections/services/inspection.service";
import { PaymentCheckout } from "@/features/inspections/components/payment-checkout";

export const metadata: Metadata = { title: "Pay for inspection" };

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ method?: string }>;
};

function parseMethod(value?: string): PaymentMethod | undefined {
  const methods = Object.values(PAYMENT_METHODS) as string[];
  return value && methods.includes(value) ? (value as PaymentMethod) : undefined;
}

export default async function InspectionPayPage({ params, searchParams }: PageProps) {
  const [{ id }, { method }] = await Promise.all([params, searchParams]);

  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  const request = await getInspection(id);
  if (!request) notFound();

  // Only the buyer may pay, and only while it's still unpaid.
  if (request.requester.id !== user.id) redirect(ROUTES.inspections);
  if (request.paymentStatus === INSPECTION_PAYMENT_STATUSES.PAID) redirect(ROUTES.inspections);

  const title = request.listing?.title ?? request.deviceInfo ?? "Inspection";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={ROUTES.inspections}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Back to my inspections
      </Link>

      <div className="mt-4 mb-6 text-center">
        <div className="bg-primary/10 text-primary mx-auto grid size-11 place-items-center rounded-xl">
          <ShieldCheck className="size-6" />
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Pay for your inspection</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {request.planName ? `${request.planName} · ` : ""}
          {title}
        </p>
      </div>

      <PaymentCheckout
        requestId={request.id}
        amount={request.feeAmount}
        currency={request.currency}
        initialMethod={parseMethod(method)}
      />
    </div>
  );
}
