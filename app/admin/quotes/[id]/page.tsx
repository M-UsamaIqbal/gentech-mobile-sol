import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { QUOTE_STATUSES, ROUTES } from "@/lib/constants";
import { requireAdmin } from "@/features/admin/lib/require-admin";
import { getQuote } from "@/features/quotes/services/quote.service";
import { QuoteResult } from "@/features/quotes/components/quote-result";
import { AdminQuoteInspection } from "@/features/quotes/components/admin-quote-inspection";
import { AdminQuoteReview } from "@/features/quotes/components/admin-quote-review";

export const metadata: Metadata = { title: "Quote · Admin" };

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect(ROUTES.dashboard);

  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();

  const flags = quote.aiFlags;

  return (
    <div className="space-y-6">
      <Link
        href={ROUTES.adminQuotes}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> All quotes
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <QuoteResult quote={quote} />

        <div className="space-y-4">
          {/* Seller */}
          <div className="bg-card rounded-xl border p-5">
            <h2 className="text-sm font-semibold">Seller</h2>
            <p className="mt-1 text-sm">{quote.user?.name ?? "—"}</p>
            <p className="text-muted-foreground text-xs">{quote.user?.email ?? ""}</p>
          </div>

          {/* Raw AI output */}
          <div className="bg-card rounded-xl border p-5">
            <h2 className="text-sm font-semibold">AI output</h2>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Raw grade</dt>
                <dd className="font-medium">
                  {(flags as { rawGrade?: string } | null)?.rawGrade ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Effective grade</dt>
                <dd className="font-medium">{quote.aiGrade ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Confidence</dt>
                <dd className="font-medium">
                  {flags ? `${Math.round(flags.confidence * 100)}%` : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Retake flagged</dt>
                <dd className="font-medium">
                  {flags && flags.retake_needed.length > 0 ? flags.retake_needed.join(", ") : "None"}
                </dd>
              </div>
            </dl>
            {flags?.screenshot_data ? (
              <p className="text-muted-foreground mt-2 text-xs">
                Screenshot read: {flags.screenshot_data.model || "?"} ·{" "}
                {flags.screenshot_data.storage || "?"} · battery{" "}
                {flags.screenshot_data.battery_health || "?"}
              </p>
            ) : null}
          </div>

          {/* Answers */}
          <div className="bg-card rounded-xl border p-5">
            <h2 className="mb-2 text-sm font-semibold">Seller&apos;s answers</h2>
            <pre className="bg-muted/50 text-muted-foreground overflow-x-auto rounded-lg p-3 text-xs">
              {JSON.stringify(quote.answers, null, 2)}
            </pre>
          </div>

          {quote.status === QUOTE_STATUSES.PENDING ? (
            <AdminQuoteReview quote={quote} />
          ) : (
            <AdminQuoteInspection quote={quote} />
          )}
        </div>
      </div>
    </div>
  );
}
