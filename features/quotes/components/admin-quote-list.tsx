import Link from "next/link";

import { QUOTE_STATUSES, QUOTE_STATUS_LABELS, ROUTES } from "@/lib/constants";
import { formatPrice } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import type { QuoteDto } from "@/features/quotes/types";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PK", { dateStyle: "medium" });
}

/** Offer column: "—" until reviewed, then the firm offer (single price). */
function offer(q: QuoteDto): string {
  if (q.status === QUOTE_STATUSES.PENDING || q.status === QUOTE_STATUSES.DECLINED) return "—";
  if (q.priceMin === q.priceMax) return formatPrice(q.priceMax);
  return `${formatPrice(q.priceMin)} – ${formatPrice(q.priceMax)}`;
}

export function AdminQuoteList({ quotes }: { quotes: QuoteDto[] }) {
  if (quotes.length === 0) {
    return <p className="text-muted-foreground text-sm">No requests yet.</p>;
  }

  // Surface pending reviews first, then newest.
  const sorted = [...quotes].sort((a, b) => {
    const ap = a.status === QUOTE_STATUSES.PENDING ? 0 : 1;
    const bp = b.status === QUOTE_STATUSES.PENDING ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground text-left text-xs">
          <tr>
            <th className="px-3 py-2 font-medium">Request</th>
            <th className="px-3 py-2 font-medium">Phone</th>
            <th className="px-3 py-2 font-medium">Seller</th>
            <th className="px-3 py-2 text-right font-medium">Offer</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((q) => {
            const isPending = q.status === QUOTE_STATUSES.PENDING;
            return (
              <tr key={q.id} className="hover:bg-muted/30 border-t">
                <td className="px-3 py-2">
                  <Link
                    href={`${ROUTES.adminQuotes}/${q.id}`}
                    className="text-primary font-mono font-medium hover:underline"
                  >
                    {q.id}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  {q.brand} {q.model} · {q.storage}
                </td>
                <td className="text-muted-foreground px-3 py-2">{q.user?.name ?? "—"}</td>
                <td className="px-3 py-2 text-right">{offer(q)}</td>
                <td className="px-3 py-2">
                  <Badge variant={isPending ? "default" : "secondary"}>
                    {QUOTE_STATUS_LABELS[q.status]}
                  </Badge>
                </td>
                <td className="text-muted-foreground px-3 py-2">{fmtDate(q.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
