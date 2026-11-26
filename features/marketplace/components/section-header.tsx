"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { LocalizedLink } from "@/components/localized-link";

export function SectionHeader({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description?: string;
  href?: string;
  actionLabel?: string;
}) {
  const t = useTranslations("common");

  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-border/70 pb-3">
      <div>
        <h2 className="heading-5 flex items-center gap-2">
          <span aria-hidden="true" className="bg-brand h-5 w-1 shrink-0 rounded-full" />
          {title}
        </h2>
        {description ? <p className="text-muted-foreground mt-1 text-sm">{description}</p> : null}
      </div>
      {href ? (
        <LocalizedLink
          href={href}
          className="text-brand hover:text-brand/80 flex shrink-0 items-center gap-1 text-sm font-medium transition-colors"
        >
          {actionLabel ?? t("seeAll")}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </LocalizedLink>
      ) : null}
    </div>
  );
}
