"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Lock, Smartphone } from "lucide-react";
import { toast } from "sonner";

import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  ROUTES,
  type PaymentMethod,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmInspectionPaymentAction } from "@/features/inspections/actions/payment.actions";

const METHODS: Array<{ id: PaymentMethod; icon: typeof Smartphone }> = [
  { id: PAYMENT_METHODS.JAZZCASH, icon: Smartphone },
  { id: PAYMENT_METHODS.EASYPAISA, icon: Smartphone },
  { id: PAYMENT_METHODS.CARD, icon: CreditCard },
];

interface Props {
  requestId: string;
  amount: number;
  currency: string;
  initialMethod?: PaymentMethod;
}

export function PaymentCheckout({ requestId, amount, currency, initialMethod }: Props) {
  const router = useRouter();
  const [method, setMethod] = React.useState<PaymentMethod>(
    initialMethod ?? PAYMENT_METHODS.JAZZCASH,
  );
  const [pending, setPending] = React.useState(false);

  async function pay(outcome: "PAID" | "FAILED") {
    setPending(true);
    const result = await confirmInspectionPaymentAction({ requestId, method, outcome });
    setPending(false);
    if (result.ok) {
      toast.success("Payment successful! Your inspection is confirmed.");
      router.push(ROUTES.inspections);
      router.refresh();
    } else {
      toast.error(result.error ?? "Payment failed. Please try again.");
      router.refresh();
    }
  }

  const isWallet = method !== PAYMENT_METHODS.CARD;

  return (
    <div className="bg-card mx-auto max-w-md rounded-2xl border p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">Amount due</span>
        <span className="text-2xl font-bold">{formatPrice(amount, { currency })}</span>
      </div>

      {/* Method tabs */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        {METHODS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMethod(id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-colors",
              method === id ? "border-primary ring-primary/30 ring-2" : "hover:border-primary/40",
            )}
          >
            <Icon className="size-5" />
            {PAYMENT_METHOD_LABELS[id]}
          </button>
        ))}
      </div>

      {/* Method-specific (mock) fields */}
      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void pay("PAID");
        }}
      >
        {isWallet ? (
          <div className="space-y-1.5">
            <Label htmlFor="mobile">{PAYMENT_METHOD_LABELS[method]} mobile number</Label>
            <Input id="mobile" inputMode="tel" placeholder="03xx-xxxxxxx" required maxLength={20} />
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="card">Card number</Label>
              <Input id="card" inputMode="numeric" placeholder="4111 1111 1111 1111" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="exp">Expiry</Label>
                <Input id="exp" placeholder="MM/YY" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cvv">CVV</Label>
                <Input id="cvv" inputMode="numeric" placeholder="123" required maxLength={4} />
              </div>
            </div>
          </>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
          {pending ? "Processing…" : `Pay ${formatPrice(amount, { currency })}`}
        </Button>
      </form>

      <div className="mt-4 rounded-lg border border-dashed p-3 text-center">
        <p className="text-muted-foreground text-xs">
          Sandbox mode — no real charge is made. Use the button below to simulate a failure.
        </p>
        <button
          type="button"
          onClick={() => void pay("FAILED")}
          disabled={pending}
          className="text-muted-foreground hover:text-foreground mt-1 text-xs underline"
        >
          Simulate failed payment
        </button>
      </div>
    </div>
  );
}
