"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { PhoneComparisonTable } from "@/features/phone-intelligence/components/phone-comparison-table";
import type { PhoneSpecComparison } from "@/features/phone-intelligence/schemas/comparison.schema";

type ComparisonWithControlsProps = {
  phones: PhoneSpecComparison[];
  currency: string;
  idParam: "listings" | "phones";
  marketplaceHref: string;
  canCompare: boolean;
};

export function ComparisonWithControls({
  phones,
  currency,
  idParam,
  marketplaceHref,
  canCompare,
}: ComparisonWithControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("compare");
  const tUi = useTranslations("uiActions");

  function remove(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    const remaining = (params.get(idParam) ?? "")
      .split(",")
      .filter((value) => value && value !== id);

    if (remaining.length > 0) params.set(idParam, remaining.join(","));
    else params.delete(idParam);

    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {canCompare ? t("hint") : t("selectMore")}
        </p>
        <Link
          href={marketplaceHref}
          className="border-input bg-background hover:bg-muted rounded-lg border px-3 py-1.5 text-sm"
        >
          {tUi("browseMarketplace")}
        </Link>
      </div>
      <PhoneComparisonTable
        phones={phones}
        currency={currency}
        onRemove={remove}
        removeLabel={t("removeFromCompare")}
      />
    </>
  );
}
