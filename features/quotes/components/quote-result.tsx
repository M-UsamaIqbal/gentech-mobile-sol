import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Hourglass,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  PTA_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUSES,
  type QuoteGrade,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import type { QuoteDto } from "@/features/quotes/types";

const GRADE_STYLE: Record<QuoteGrade, { ring: string; text: string; label: string }> = {
  A: { ring: "ring-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600", label: "Excellent" },
  B: { ring: "ring-amber-500/40 bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600", label: "Good" },
  C: { ring: "ring-orange-500/40 bg-orange-50 dark:bg-orange-950/30", text: "text-orange-600", label: "Fair" },
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Presentational quote result (Step 6). Interactive pieces (accept / share /
 * requote) are passed in via `actions` so this stays a server component.
 */
export function QuoteResult({ quote, actions }: { quote: QuoteDto; actions?: React.ReactNode }) {
  const grade = (quote.aiGrade ?? "C") as QuoteGrade;
  const gradeStyle = GRADE_STYLE[grade];
  const mismatches = quote.aiFlags?.mismatches ?? [];
  const expired = quote.status === QUOTE_STATUSES.EXPIRED;
  // Manual-review requests carry no AI output; they're priced by an admin.
  const isManual = quote.aiFlags == null;
  const pending = quote.status === QUOTE_STATUSES.PENDING;
  const declined = quote.status === QUOTE_STATUSES.DECLINED;

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {pending ? "Quote request" : declined ? "Quote request" : isManual ? "Your offer" : "Instant Quote"}
        </p>
        <h1 className="font-mono text-2xl font-bold tracking-tight">{quote.id}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {quote.brand} {quote.model} · {quote.storage} · {PTA_STATUS_LABELS[quote.ptaStatus]}
        </p>
      </div>
      <Badge variant={pending ? "default" : declined || expired ? "outline" : "secondary"}>
        {QUOTE_STATUS_LABELS[quote.status]}
      </Badge>
    </div>
  );

  // --- Manual flow: PENDING review -----------------------------------------
  if (pending) {
    return (
      <div className="space-y-6">
        {header}
        <div className="rounded-2xl border border-amber-400 bg-amber-50 p-5 dark:bg-amber-950/20">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
            <Hourglass className="size-4" /> Under review
          </p>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
            Thanks! Our team is reviewing your phone&apos;s details and photos. We&apos;ll email you a
            firm offer shortly — it&apos;ll also appear here.
          </p>
        </div>
        <QuotePhotos quote={quote} />
        {actions}
      </div>
    );
  }

  // --- Manual flow: DECLINED -----------------------------------------------
  if (declined) {
    return (
      <div className="space-y-6">
        {header}
        <div className="border-destructive/50 bg-destructive/5 rounded-2xl border p-5">
          <p className="text-destructive flex items-center gap-2 text-sm font-semibold">
            <XCircle className="size-4" /> We couldn&apos;t make an offer
          </p>
          {quote.declineReason ? (
            <p className="text-muted-foreground mt-2 text-sm">{quote.declineReason}</p>
          ) : null}
        </div>
        <QuotePhotos quote={quote} />
        {actions}
      </div>
    );
  }

  // --- Manual flow: priced offer (ACTIVE and beyond) -----------------------
  if (isManual) {
    return (
      <div className="space-y-6">
        {header}
        <div className="bg-card rounded-2xl border p-5">
          <p className="text-muted-foreground text-sm">Our offer for your device</p>
          <p className="text-primary text-3xl font-bold tracking-tight">
            {formatPrice(quote.priceMax)}
          </p>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
            <CalendarClock className="size-3.5" />
            Valid until {formatDateTime(quote.validUntil)}
          </p>
        </div>
        <QuotePhotos quote={quote} />
        <div className="bg-muted/40 text-muted-foreground flex items-start gap-2 rounded-xl p-4 text-sm">
          <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" />
          <p>If your phone matches your answers and photos at inspection, we pay the quoted price.</p>
        </div>
        {actions}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      {/* Price + grade */}
      <div className="bg-card grid gap-4 rounded-2xl border p-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <div
          className={cn(
            "grid size-20 place-items-center rounded-2xl ring-2",
            gradeStyle.ring,
          )}
        >
          <div className="text-center">
            <div className={cn("text-3xl font-bold", gradeStyle.text)}>{grade}</div>
            <div className="text-muted-foreground text-[10px]">{gradeStyle.label}</div>
          </div>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Your estimated price range</p>
          <p className="text-3xl font-bold tracking-tight">
            {formatPrice(quote.priceMin)} – {formatPrice(quote.priceMax)}
          </p>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
            <CalendarClock className="size-3.5" />
            Valid until {formatDateTime(quote.validUntil)}
          </p>
        </div>
      </div>

      {/* Mismatches */}
      {mismatches.length > 0 ? (
        <div className="rounded-xl border border-amber-400 bg-amber-50 p-4 dark:bg-amber-950/20">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-400">
            <AlertTriangle className="size-4" /> A few things to note
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-200">
            {mismatches.map((m, i) => (
              <li key={i}>• {m}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Detected defects */}
      <div className="bg-card rounded-xl border p-5">
        <h2 className="text-sm font-semibold">What our AI detected</h2>
        {quote.aiDefects.length === 0 ? (
          <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="size-4 text-emerald-600" /> No visible defects — the phone
            looks to be in great shape.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {quote.aiDefects.map((d, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  <span className="text-muted-foreground mr-1.5 text-xs">Photo {d.photo}</span>
                  {d.issue}
                </span>
                <Badge variant={d.severity === "major" ? "outline" : "secondary"}>
                  {d.severity}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Price breakdown */}
      <div className="bg-card rounded-xl border p-5">
        <h2 className="text-sm font-semibold">How we calculated this</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label={`Base price (${quote.brand} ${quote.model} ${quote.storage})`}>
            {formatPrice(quote.basePricePkr)}
          </Row>
          <Row label={`Grade ${grade} multiplier`}>×{quote.gradeMultiplier}</Row>
          {quote.deductions.length > 0 ? (
            <>
              <div className="text-muted-foreground pt-1 text-xs font-medium">Deductions</div>
              {quote.deductions.map((d) => (
                <Row key={d.key} label={d.label} negative>
                  −{formatPrice(d.amount)}
                </Row>
              ))}
            </>
          ) : (
            <Row label="Deductions">None</Row>
          )}
          <div className="mt-2 border-t pt-2">
            <Row label="Quoted range" strong>
              {formatPrice(quote.priceMin)} – {formatPrice(quote.priceMax)}
            </Row>
          </div>
        </dl>
      </div>

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

      {/* Terms */}
      <div className="bg-muted/40 text-muted-foreground flex items-start gap-2 rounded-xl p-4 text-sm">
        <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" />
        <p>If your phone matches your answers and photos at inspection, we pay the quoted price.</p>
      </div>

      {actions}
    </div>
  );
}

function QuotePhotos({ quote }: { quote: QuoteDto }) {
  if (quote.photos.length === 0) return null;
  return (
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
  );
}

function Row({
  label,
  children,
  negative,
  strong,
}: {
  label: string;
  children: React.ReactNode;
  negative?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={cn("text-muted-foreground", strong && "text-foreground font-semibold")}>
        {label}
      </dt>
      <dd
        className={cn(
          "text-right font-medium",
          negative && "text-destructive",
          strong && "text-base font-bold",
        )}
      >
        {children}
      </dd>
    </div>
  );
}
