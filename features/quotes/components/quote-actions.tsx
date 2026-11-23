"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Download, Link2, Loader2, Share2, Truck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { acceptQuoteAction } from "@/features/quotes/actions/quote.actions";
import type { QuoteDto } from "@/features/quotes/types";

const SLOT_WINDOWS = [
  "Morning (10am–1pm)",
  "Afternoon (1pm–5pm)",
  "Evening (5pm–8pm)",
];

/** Accept an active quote, capturing a pickup address + time slot (Step 6). */
export function QuoteAcceptPanel({ quote }: { quote: QuoteDto }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  if (quote.acceptedAt || quote.status === "ACCEPTED" || quote.status === "INSPECTED" || quote.status === "PAID") {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 p-4 dark:bg-emerald-950/20">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          <Check className="size-4" /> Quote accepted
        </p>
        {quote.pickupAddress ? (
          <p className="text-muted-foreground mt-1 text-sm">
            Pickup: {quote.pickupAddress}
            {quote.pickupSlot ? ` · ${quote.pickupSlot}` : ""}
          </p>
        ) : null}
        <p className="text-muted-foreground mt-1 text-xs">
          Our team will contact you to confirm the pickup.
        </p>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = String(form.get("pickupDate") ?? "");
    const window = String(form.get("pickupWindow") ?? "");
    setPending(true);
    const result = await acceptQuoteAction({
      id: quote.id,
      pickupAddress: String(form.get("pickupAddress") ?? ""),
      pickupSlot: date ? `${date} · ${window}` : window,
    });
    setPending(false);
    if (result.ok) {
      toast.success("Quote accepted! We'll arrange pickup.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Could not accept the quote.");
    }
  }

  if (!open) {
    return (
      <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
        <Truck className="size-4" /> Accept quote
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card space-y-4 rounded-xl border p-5">
      <p className="text-sm font-semibold">Arrange pickup</p>
      <div className="space-y-1.5">
        <Label htmlFor="pickupAddress">Pickup address</Label>
        <Textarea id="pickupAddress" name="pickupAddress" required rows={2} maxLength={400} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pickupDate">Preferred date</Label>
          <Input id="pickupDate" name="pickupDate" type="date" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pickupWindow">Time slot</Label>
          <select
            id="pickupWindow"
            name="pickupWindow"
            required
            defaultValue=""
            className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
          >
            <option value="" disabled>
              Select a slot
            </option>
            {SLOT_WINDOWS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Truck className="size-4" />}
          Confirm pickup
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Download (print to PDF), copy link and native share. Hidden when printing. */
export function QuoteShareBar({ quoteId }: { quoteId: string }) {
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard.");
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `GenTech quote ${quoteId}`, url: window.location.href });
      } catch {
        /* user dismissed */
      }
    } else {
      void copyLink();
    }
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button variant="outline" onClick={() => window.print()}>
        <Download className="size-4" /> Download / print
      </Button>
      <Button variant="outline" onClick={copyLink}>
        <Link2 className="size-4" /> Copy link
      </Button>
      <Button variant="outline" onClick={share}>
        <Share2 className="size-4" /> Share
      </Button>
    </div>
  );
}
