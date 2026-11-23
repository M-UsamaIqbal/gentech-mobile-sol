import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { QUOTE_STATUSES, ROUTES, USER_ROLES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { getQuote, isExpired } from "@/features/quotes/services/quote.service";
import { QuoteResult } from "@/features/quotes/components/quote-result";
import { QuoteAcceptPanel, QuoteShareBar } from "@/features/quotes/components/quote-actions";

export const metadata: Metadata = { title: "Your Quote" };

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  const quote = await getQuote(id);
  if (!quote) notFound();

  const isAdmin = user.role === USER_ROLES.ADMIN;
  const isOwner = quote.user?.id === user.id;
  if (!isOwner && !isAdmin) notFound();

  const expired = isExpired(quote);
  // The offer can be accepted while it's active and unexpired; once accepted,
  // everyone sees the confirmed pickup summary.
  const canShowAccept =
    (quote.status === QUOTE_STATUSES.ACTIVE && !expired && isOwner) || Boolean(quote.acceptedAt);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <QuoteResult
        quote={quote}
        actions={
          <div className="space-y-4">
            {expired && quote.status === QUOTE_STATUSES.EXPIRED ? (
              <p className="text-muted-foreground text-sm">
                This offer has expired. Submit a new request to get a fresh offer.
              </p>
            ) : null}
            {canShowAccept ? <QuoteAcceptPanel quote={quote} /> : null}
            <QuoteShareBar quoteId={quote.id} />
          </div>
        }
      />
    </div>
  );
}
