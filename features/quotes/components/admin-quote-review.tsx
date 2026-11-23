"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  approveQuoteAction,
  declineQuoteAction,
} from "@/features/quotes/actions/admin-quote.actions";
import type { QuoteDto } from "@/features/quotes/types";

/**
 * Manual review of a PENDING request: either approve with a firm offer price
 * (emails the seller the offer) or decline with a reason (emails the seller).
 */
export function AdminQuoteReview({ quote }: { quote: QuoteDto }) {
  const router = useRouter();
  const [mode, setMode] = React.useState<"approve" | "decline">("approve");
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);

    const res =
      mode === "approve"
        ? await approveQuoteAction({
            id: quote.id,
            offerPricePkr: Number(form.get("offerPricePkr") ?? 0),
          })
        : await declineQuoteAction({
            id: quote.id,
            reason: String(form.get("reason") ?? ""),
          });

    setPending(false);
    if (res.ok) {
      toast.success(
        mode === "approve" ? "Offer sent to the seller." : "Request declined — seller notified.",
      );
      router.refresh();
    } else {
      toast.error(res.error ?? "Could not submit your decision.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card space-y-4 rounded-xl border p-5">
      <div>
        <h2 className="text-sm font-semibold">Review request</h2>
        <p className="text-muted-foreground text-xs">
          Set a firm offer price to send the seller, or decline with a reason. Either way they get
          an email.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("approve")}
          className={
            "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition-colors " +
            (mode === "approve"
              ? "border-emerald-500 ring-2 ring-emerald-500/30"
              : "hover:border-primary/40")
          }
        >
          <CheckCircle2 className="size-4 text-emerald-600" /> Make an offer
        </button>
        <button
          type="button"
          onClick={() => setMode("decline")}
          className={
            "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition-colors " +
            (mode === "decline"
              ? "border-destructive ring-destructive/30 ring-2"
              : "hover:border-primary/40")
          }
        >
          <XCircle className="text-destructive size-4" /> Decline
        </button>
      </div>

      {mode === "approve" ? (
        <div className="space-y-1.5">
          <Label htmlFor="offerPricePkr">Offer price (PKR)</Label>
          <Input
            id="offerPricePkr"
            name="offerPricePkr"
            type="number"
            min={1}
            step="500"
            required
            placeholder="e.g. 150000"
          />
          <p className="text-muted-foreground text-xs">
            This exact amount is emailed to the seller as your firm offer.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="reason">Reason (shown to the seller)</Label>
          <Textarea
            id="reason"
            name="reason"
            required
            rows={2}
            maxLength={500}
            placeholder="e.g. We're not buying this model right now."
          />
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {mode === "approve" ? "Approve & email offer" : "Decline & email"}
      </Button>
    </form>
  );
}
