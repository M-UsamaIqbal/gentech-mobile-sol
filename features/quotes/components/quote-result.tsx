import { CalendarClock, Clock, ShieldCheck, XCircle } from "lucide-react";

import { PTA_STATUS_LABELS, QUOTE_STATUS_LABELS, QUOTE_STATUSES } from "@/lib/constants";
import { formatPrice } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import type { QuoteDto } from "@/features/quotes/types";

const PRICED_STATUSES: string[] = [
  QUOTE_STATUSES.ACTIVE,
  QUOTE_STATUSES.ACCEPTED,
  QUOTE_STATUSES.INSPECTED,
  QUOTE_STATUSES.PAID,
  QUOTE_STATUSES.EXPIRED,
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Presentational request/offer view. Reflects the manual-review lifecycle:
 * pending → under review; declined → reason; priced → firm offer + accept panel.
 * Interactive pieces (accept / share) are passed in via `actions`.
 */
export function QuoteResult({ quote, actions }: { quote: QuoteDto; actions?: React.ReactNode }) {
  const isPending = quote.status === QUOTE_STATUSES.PENDING;
  const isDeclined = quote.status === QUOTE_STATUSES.DECLINED;
  const isPriced = PRICED_STATUSES.includes(quote.status);
  const isActive = quote.status === QUOTE_STATUSES.ACTIVE;

  const offerText =
    quote.priceMin === quote.priceMax
      ? formatPrice(quote.priceMax)
      : `${formatPrice(quote.priceMin)} – ${formatPrice(quote.priceMax)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Sell your phone
          </p>
          <h1 className="font-mono text-2xl font-bold tracking-tight">{quote.id}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {quote.brand} {quote.model} · {quote.storage} · {PTA_STATUS_LABELS[quote.ptaStatus]}
          </p>
        </div>
        <Badge variant={isPending ? "default" : isDeclined ? "outline" : "secondary"}>
          {QUOTE_STATUS_LABELS[quote.status]}
        </Badge>
      </div>

      {/* Pending: under review */}
      {isPending ? (
        <div className="bg-card flex items-start gap-3 rounded-2xl border p-5">
          <span className="bg-primary/10 text-primary grid size-11 shrink-0 place-items-center rounded-xl">
            <Clock className="size-5" />
          </span>
          <div>
            <p className="font-semibold">We&apos;re reviewing your phone</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Our team is checking your details and photos. We&apos;ll email you a firm offer
              shortly — usually within a day. You can also come back to this page to see it.
            </p>
          </div>
        </div>
      ) : null}

      {/* Declined */}
      {isDeclined ? (
        <div className="border-destructive/40 bg-destructive/5 flex items-start gap-3 rounded-2xl border p-5">
          <span className="bg-destructive/10 text-destructive grid size-11 shrink-0 place-items-center rounded-xl">
            <XCircle className="size-5" />
          </span>
          <div>
            <p className="font-semibold">We couldn&apos;t make an offer</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {quote.declineReason ?? "We're unable to buy this device at the moment."}
            </p>
          </div>
        </div>
      ) : null}

      {/* Priced: the firm offer */}
      {isPriced ? (
        <div className="bg-card rounded-2xl border p-5">
          <p className="text-muted-foreground text-sm">Our offer for your phone</p>
          <p className="text-primary text-4xl font-bold tracking-tight">{offerText}</p>
          {isActive ? (
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
              <CalendarClock className="size-3.5" />
              Offer valid until {formatDateTime(quote.validUntil)}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Photos */}
      {quote.photos.length > 0 ? (
        <div className="bg-card rounded-xl border p-5">
          <h2 className="mb-3 text-sm font-semibold">Your photos</h2>
          <div className="grid grid-cols-5 gap-2">
            {[...quote.photos]
              .sort((a, b) => a.slot - b.slot)
              .map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.slot}
                  src={p.url}
                  alt={`Photo ${p.slot}`}
                  className="aspect-square w-full rounded-lg border object-cover"
                />
              ))}
          </div>
        </div>
      ) : null}

      {/* Terms (only once an offer exists) */}
      {isPriced ? (
        <div className="bg-muted/40 text-muted-foreground flex items-start gap-2 rounded-xl p-4 text-sm">
          <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" />
          <p>
            Accept to schedule a free pickup. Our team confirms the phone matches your details at
            collection, then pays you on the spot.
          </p>
        </div>
      ) : null}

      {actions}
    </div>
  );
}
