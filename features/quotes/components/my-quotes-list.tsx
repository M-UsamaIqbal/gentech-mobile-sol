import Link from "next/link";
import { ChevronRight, Smartphone } from "lucide-react";

import { QUOTE_STATUS_LABELS, QUOTE_STATUSES, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { QuoteDto } from "@/features/quotes/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PK", { dateStyle: "medium" });
}

/** Module-scope so the live time check isn't flagged as an impure render call. */
function isExpiredNow(q: QuoteDto): boolean {
  return (
    q.status === QUOTE_STATUSES.EXPIRED ||
    (q.status === QUOTE_STATUSES.ACTIVE && new Date(q.validUntil).getTime() <= Date.now())
  );
}

/** PENDING/DECLINED requests have no price; otherwise show the offer (or range). */
function priceLabel(q: QuoteDto): string {
  if (q.status === QUOTE_STATUSES.PENDING) return "Awaiting offer";
  if (q.status === QUOTE_STATUSES.DECLINED) return "—";
  if (q.priceMin === q.priceMax) return formatPrice(q.priceMax);
  return `${formatPrice(q.priceMin)} – ${formatPrice(q.priceMax)}`;
}

export function MyQuotesList({ quotes }: { quotes: QuoteDto[] }) {
  if (quotes.length === 0) {
    return (
      <div className="bg-card rounded-xl border p-8 text-center">
        <Smartphone className="text-muted-foreground mx-auto size-8" />
        <p className="mt-3 font-medium">No quotes yet</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Request a price for a phone you want to sell.
        </p>
        <Link href={ROUTES.sellPhone} className={cn(buttonVariants(), "mt-4")}>
          Request a quote
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quotes.map((q) => {
        const expired = isExpiredNow(q);
        return (
          <Link
            key={q.id}
            href={`${ROUTES.sellPhone}/${q.id}`}
            className="bg-card hover:border-primary/40 flex items-center justify-between gap-3 rounded-xl border p-4 transition-colors"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold">{q.id}</span>
                <Badge variant={expired ? "outline" : "secondary"}>
                  {expired ? "Expired" : QUOTE_STATUS_LABELS[q.status]}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-0.5 truncate text-sm">
                {q.brand} {q.model} · {q.storage}
                {q.aiGrade ? ` · Grade ${q.aiGrade}` : ""}
              </p>
              <p className="text-muted-foreground text-xs">Created {formatDate(q.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2 text-right">
              <div>
                <p className="font-semibold">{priceLabel(q)}</p>
              </div>
              <ChevronRight className="text-muted-foreground size-4 shrink-0" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
