"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, MailCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { PTA_STATUS_LABELS, ROUTES, type PtaStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DISPLAY_ISSUE_OPTIONS,
  PART_OPTIONS,
  PTA_STATUS_URDU,
  WARRANTY_OPTIONS,
} from "@/features/quotes/lib/questions";
import { QuotePhotoUpload } from "@/features/quotes/components/quote-photo-upload";
import { createQuoteAction } from "@/features/quotes/actions/quote.actions";
import type { QuoteAnswers, QuotePhoto } from "@/features/quotes/schemas/quote";
import type { CatalogDto } from "@/features/quotes/types";

interface Props {
  catalog: CatalogDto;
  isAuthenticated: boolean;
}

type Draft = Partial<Omit<QuoteAnswers, "partsReplaced" | "displayIssues">> & {
  partsReplaced: QuoteAnswers["partsReplaced"];
  displayIssues: QuoteAnswers["displayIssues"];
};

const STEP_TITLES = [
  { en: "Your phone", ur: "آپ کا فون" },
  { en: "PTA status", ur: "پی ٹی اے اسٹیٹس" },
  { en: "Box, charger & warranty", ur: "ڈبہ، چارجر اور وارنٹی" },
  { en: "Battery health", ur: "بیٹری ہیلتھ" },
  { en: "Repairs & biometrics", ur: "مرمت اور بایومیٹرکس" },
  { en: "Condition", ur: "حالت" },
  { en: "Photos", ur: "تصاویر" },
  { en: "Review", ur: "جائزہ" },
];

export function QuoteWizard({ catalog, isAuthenticated }: Props) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  const [brand, setBrand] = React.useState("");
  const [model, setModel] = React.useState("");
  const [storage, setStorage] = React.useState("");
  const [photos, setPhotos] = React.useState<QuotePhoto[]>([]);
  const [a, setA] = React.useState<Draft>({ partsReplaced: [], displayIssues: [] });

  const isApple = brand.toLowerCase() === "apple";
  const models = brand ? (catalog.modelsByBrand[brand] ?? []) : [];
  const variants = React.useMemo(
    () => (model ? (catalog.variantsByModel[`${brand}::${model}`] ?? []) : []),
    [catalog, brand, model],
  );
  const storages = React.useMemo(
    () => Array.from(new Set(variants.map((v) => v.storage))),
    [variants],
  );
  const ptaOptions = React.useMemo(
    () =>
      Array.from(
        new Set(variants.filter((v) => v.storage === storage).map((v) => v.ptaStatus)),
      ) as PtaStatus[],
    [variants, storage],
  );

  function update(patch: Partial<Draft>) {
    setA((prev) => ({ ...prev, ...patch }));
  }

  function toggleIn<T>(list: T[], item: T): T[] {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
  }

  const canAdvance = (() => {
    switch (step) {
      case 0:
        return Boolean(brand && model && storage);
      case 1:
        return Boolean(a.ptaStatus);
      case 2:
        return (
          typeof a.boxAvailable === "boolean" &&
          typeof a.chargerAvailable === "boolean" &&
          Boolean(a.warranty)
        );
      case 3:
        return !isApple || (typeof a.batteryHealth === "number" && a.batteryHealth >= 0);
      case 4:
        return typeof a.biometricsWorking === "boolean";
      case 5:
        return (
          typeof a.cameraIssue === "boolean" &&
          typeof a.waterDamage === "boolean" &&
          typeof a.screenProtector === "boolean"
        );
      case 6:
        return photos.length === 5; // all 5 slots filled
      default:
        return true;
    }
  })();

  async function submit() {
    const answers: QuoteAnswers = {
      ptaStatus: a.ptaStatus as PtaStatus,
      boxAvailable: a.boxAvailable!,
      chargerAvailable: a.chargerAvailable!,
      warranty: a.warranty!,
      batteryHealth: typeof a.batteryHealth === "number" ? a.batteryHealth : null,
      partsReplaced: a.partsReplaced,
      biometricsWorking: a.biometricsWorking!,
      displayIssues: a.displayIssues,
      cameraIssue: a.cameraIssue!,
      waterDamage: a.waterDamage!,
      screenProtector: a.screenProtector!,
    };

    setSubmitting(true);
    const result = await createQuoteAction({ brand, model, storage, answers, photos });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Request sent — we'll review it and email you an offer.");
    router.push(`${ROUTES.sellPhone}/${result.id}`);
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-card rounded-xl border p-6 text-center">
        <Smartphone className="text-primary mx-auto size-8" />
        <p className="mt-3 font-medium">Sign in to get your instant quote</p>
        <p className="text-muted-foreground mt-1 text-sm">
          You&apos;ll need an account so we can save your quote and arrange pickup.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href={ROUTES.signIn} className={cn(buttonVariants())}>
            Sign in
          </Link>
          <Link href={ROUTES.signUp} className={cn(buttonVariants({ variant: "outline" }))}>
            Create account
          </Link>
        </div>
      </div>
    );
  }

  if (catalog.brands.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Our price list is being updated. Please check back shortly.
      </p>
    );
  }

  const lastStep = STEP_TITLES.length - 1;
  const title = STEP_TITLES[step]!;

  return (
    <div className="bg-card rounded-2xl border p-5 sm:p-6">
      {/* Progress */}
      <div className="mb-5">
        <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs">
          <span>
            Step {step + 1} of {STEP_TITLES.length}
          </span>
          <span className="font-medium">
            {title.en} · <span dir="rtl">{title.ur}</span>
          </span>
        </div>
        <div className="bg-muted h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="min-h-[18rem]">
        {step === 0 && (
          <div className="space-y-4">
            <Field labelEn="Brand" labelUr="برانڈ">
              <SelectBox
                value={brand}
                placeholder="Select brand"
                options={catalog.brands.map((b) => ({ value: b, label: b }))}
                onChange={(v) => {
                  setBrand(v);
                  setModel("");
                  setStorage("");
                }}
              />
            </Field>
            {brand ? (
              <Field labelEn="Model" labelUr="ماڈل">
                <SelectBox
                  value={model}
                  placeholder="Select model"
                  options={models.map((m) => ({ value: m, label: m }))}
                  onChange={(v) => {
                    setModel(v);
                    setStorage("");
                  }}
                />
              </Field>
            ) : null}
            {model ? (
              <Field labelEn="Storage" labelUr="اسٹوریج">
                <div className="flex flex-wrap gap-2">
                  {storages.map((s) => (
                    <ChoiceChip key={s} selected={storage === s} onClick={() => setStorage(s)}>
                      {s}
                    </ChoiceChip>
                  ))}
                </div>
              </Field>
            ) : null}
          </div>
        )}

        {step === 1 && (
          <Field labelEn="What is the PTA status?" labelUr="پی ٹی اے اسٹیٹس کیا ہے؟">
            <div className="grid gap-2">
              {ptaOptions.map((p) => (
                <OptionCard
                  key={p}
                  selected={a.ptaStatus === p}
                  onClick={() => update({ ptaStatus: p })}
                  titleEn={PTA_STATUS_LABELS[p]}
                  titleUr={PTA_STATUS_URDU[p]}
                />
              ))}
            </div>
          </Field>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <Field labelEn="Is the original box available?" labelUr="کیا اصل ڈبہ موجود ہے؟">
              <YesNo
                value={a.boxAvailable}
                onChange={(v) => update({ boxAvailable: v })}
              />
            </Field>
            <Field labelEn="Is the charger available?" labelUr="کیا چارجر موجود ہے؟">
              <YesNo
                value={a.chargerAvailable}
                onChange={(v) => update({ chargerAvailable: v })}
              />
            </Field>
            <Field labelEn="Warranty remaining?" labelUr="وارنٹی کتنی باقی ہے؟">
              <div className="grid gap-2 sm:grid-cols-2">
                {WARRANTY_OPTIONS.map((w) => (
                  <OptionCard
                    key={w.value}
                    selected={a.warranty === w.value}
                    onClick={() => update({ warranty: w.value })}
                    titleEn={w.en}
                    titleUr={w.ur}
                  />
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 3 && (
          <Field
            labelEn={`Battery health %${isApple ? " (required for iPhone)" : " (optional)"}`}
            labelUr="بیٹری ہیلتھ فیصد"
          >
            <Input
              type="number"
              min={0}
              max={100}
              inputMode="numeric"
              placeholder="e.g. 89"
              value={a.batteryHealth ?? ""}
              onChange={(e) =>
                update({
                  batteryHealth: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
            <p className="text-muted-foreground mt-1.5 text-xs">
              On iPhone: Settings → Battery → Battery Health. On Android check the battery info or an
              app.
            </p>
          </Field>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <Field
              labelEn="Any parts replaced?"
              labelUr="کوئی پرزہ تبدیل ہوا؟"
              hintEn="Select all that apply, or leave empty for none."
            >
              <div className="flex flex-wrap gap-2">
                {PART_OPTIONS.map((p) => (
                  <ChoiceChip
                    key={p.value}
                    selected={a.partsReplaced.includes(p.value)}
                    onClick={() => update({ partsReplaced: toggleIn(a.partsReplaced, p.value) })}
                  >
                    {p.en} · <span dir="rtl">{p.ur}</span>
                  </ChoiceChip>
                ))}
              </div>
            </Field>
            <Field
              labelEn="Is Face ID / fingerprint working?"
              labelUr="کیا فیس آئی ڈی / فنگر پرنٹ کام کر رہا ہے؟"
            >
              <YesNo value={a.biometricsWorking} onChange={(v) => update({ biometricsWorking: v })} />
            </Field>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <Field
              labelEn="Any display issues?"
              labelUr="ڈسپلے میں کوئی مسئلہ؟"
              hintEn="Select all that apply, or leave empty for none."
            >
              <div className="flex flex-wrap gap-2">
                {DISPLAY_ISSUE_OPTIONS.map((d) => (
                  <ChoiceChip
                    key={d.value}
                    selected={a.displayIssues.includes(d.value)}
                    onClick={() => update({ displayIssues: toggleIn(a.displayIssues, d.value) })}
                  >
                    {d.en} · <span dir="rtl">{d.ur}</span>
                  </ChoiceChip>
                ))}
              </div>
            </Field>
            <Field labelEn="Any camera issues?" labelUr="کیمرے میں کوئی مسئلہ؟">
              <YesNo value={a.cameraIssue} onChange={(v) => update({ cameraIssue: v })} />
            </Field>
            <Field labelEn="Any water damage?" labelUr="کیا پانی سے نقصان ہوا؟">
              <YesNo value={a.waterDamage} onChange={(v) => update({ waterDamage: v })} />
            </Field>
            <Field labelEn="Screen protector on?" labelUr="کیا اسکرین پروٹیکٹر لگا ہے؟">
              <YesNo value={a.screenProtector} onChange={(v) => update({ screenProtector: v })} />
            </Field>
          </div>
        )}

        {step === 6 && (
          <Field
            labelEn="Upload 5 photos"
            labelUr="5 تصاویر اپ لوڈ کریں"
            hintEn="Follow each sample. Good light, in focus."
          >
            <QuotePhotoUpload value={photos} onChange={setPhotos} />
          </Field>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <ReviewRow label="Phone" value={`${brand} ${model} · ${storage}`} />
            <ReviewRow
              label="PTA status"
              value={a.ptaStatus ? PTA_STATUS_LABELS[a.ptaStatus] : "—"}
            />
            <ReviewRow
              label="Box / charger"
              value={`${a.boxAvailable ? "Box" : "No box"} · ${a.chargerAvailable ? "Charger" : "No charger"}`}
            />
            <ReviewRow
              label="Battery health"
              value={typeof a.batteryHealth === "number" ? `${a.batteryHealth}%` : "Not provided"}
            />
            <ReviewRow
              label="Parts replaced"
              value={a.partsReplaced.length ? a.partsReplaced.join(", ") : "None"}
            />
            <ReviewRow
              label="Display issues"
              value={a.displayIssues.length ? a.displayIssues.join(", ") : "None"}
            />
            <ReviewRow label="Photos" value={`${photos.length} / 5 uploaded`} />
            <div className="bg-muted/50 text-muted-foreground rounded-lg p-3 text-xs">
              <MailCheck className="text-primary mb-1 inline size-3.5" /> Our team reviews your
              details and photos, then emails you a firm offer — usually within a day.
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          disabled={step === 0 || submitting}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          <ChevronLeft className="size-4" /> Back
        </Button>
        {step < lastStep ? (
          <Button disabled={!canAdvance} onClick={() => setStep((s) => s + 1)}>
            Next <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button disabled={submitting || photos.length !== 5} onClick={submit}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <MailCheck className="size-4" />}
            {submitting ? "Sending…" : "Submit request"}
          </Button>
        )}
      </div>
    </div>
  );
}

// --- small building blocks -------------------------------------------------

function Field({
  labelEn,
  labelUr,
  hintEn,
  children,
}: {
  labelEn: string;
  labelUr: string;
  hintEn?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label className="text-base">{labelEn}</Label>
        <p dir="rtl" className="text-muted-foreground text-sm">
          {labelUr}
        </p>
        {hintEn ? <p className="text-muted-foreground mt-0.5 text-xs">{hintEn}</p> : null}
      </div>
      {children}
    </div>
  );
}

function SelectBox({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function YesNo({
  value,
  onChange,
}: {
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[
        { v: true, en: "Yes", ur: "ہاں" },
        { v: false, en: "No", ur: "نہیں" },
      ].map((o) => (
        <button
          key={o.en}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            "rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
            value === o.v ? "border-primary ring-primary/30 ring-2" : "hover:border-primary/40",
          )}
        >
          {o.en} · <span dir="rtl">{o.ur}</span>
        </button>
      ))}
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  titleEn,
  titleUr,
}: {
  selected: boolean;
  onClick: () => void;
  titleEn: string;
  titleUr: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
        selected ? "border-primary ring-primary/30 ring-2" : "hover:border-primary/40",
      )}
    >
      <span className="font-medium">{titleEn}</span>
      <span dir="rtl" className="text-muted-foreground">
        {titleUr}
      </span>
    </button>
  );
}

function ChoiceChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        selected
          ? "border-primary bg-primary/10 text-primary font-medium"
          : "hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b pb-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
