import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { QUOTE_STATUSES, ROUTES, USER_ROLES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { getQuote, isExpired } from "@/features/quotes/services/quote.service";
import { buttonVariants } from "@/components/ui/button";
import { QuoteResult } from "@/features/quotes/components/quote-result";
import {
  QuoteAcceptPanel,
  QuoteShareBar,
  RequoteButton,
} from "@/features/quotes/components/quote-actions";

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
  const isManual = quote.aiFlags == null;
  const pending = quote.status === QUOTE_STATUSES.PENDING;
  const declined = quote.status === QUOTE_STATUSES.DECLINED;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <QuoteResult
        quote={quote}
        actions={
          pending || declined ? (
            // PENDING / DECLINED render their own state; no accept/requote here.
            declined && isOwner ? (
              <Link href={ROUTES.sellPhone} className={buttonVariants({ variant: "outline" })}>
                Start a new request
              </Link>
            ) : null
          ) : (
            <div className="space-y-4">
              {expired ? (
                <>
                  <p className="text-muted-foreground text-sm">
                    This offer has expired.{" "}
                    {isManual
                      ? "Start a new request to get a fresh offer."
                      : "Prices change, so requote to see today's offer — we'll reuse your answers and photos."}
                  </p>
                  {isOwner ? (
                    isManual ? (
                      <Link
                        href={ROUTES.sellPhone}
                        className={buttonVariants({ variant: "outline" })}
                      >
                        Start a new request
                      </Link>
                    ) : (
                      <RequoteButton quoteId={quote.id} />
                    )
                  ) : null}
                </>
              ) : isOwner || quote.acceptedAt ? (
                // Owner sees the accept form; anyone sees the summary once accepted.
                <QuoteAcceptPanel quote={quote} />
              ) : null}
              <QuoteShareBar quoteId={quote.id} />
            </div>
          )
        }
      />
    </div>
  );
}
