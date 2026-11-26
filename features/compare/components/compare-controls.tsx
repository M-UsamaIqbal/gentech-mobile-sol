"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { GitCompareArrows, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CompareAddSearch } from "./compare-add-search";
import { useCompareSelection } from "./compare-selection-provider";

export function CompareControls() {
  const t = useTranslations("compare");
  const router = useRouter();
  const { selected, selectionMode, max, start, clear, exit, compareHref } = useCompareSelection();

  React.useEffect(() => {
    if (!selectionMode) return;
    document.body.dataset.compareActive = "true";
    return () => {
      delete document.body.dataset.compareActive;
    };
  }, [selectionMode]);

  if (!selectionMode) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={start}>
        <GitCompareArrows className="size-4" />
        {t("open")}
      </Button>
    );
  }

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={exit}>
        <X className="size-4" />
        {t("exit")}
      </Button>
      <div
        data-mobile-app-compare-bar
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 shadow-lg backdrop-blur"
        role="region"
        aria-label={t("barLabel")}
      >
        <div className="mx-auto max-w-7xl space-y-2 p-3">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex flex-col">
              <p className="text-sm font-semibold">
                {t("selected", { count: selected.length, max })}
              </p>
              <p className="text-muted-foreground text-xs">{t("hint")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={selected.length === 0}>
                {t("clear")}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={selected.length < 2}
                onClick={() => router.push(compareHref)}
                className={cn(selected.length >= 2 && "shadow-md")}
              >
                <GitCompareArrows className="size-4" />
                {t("compareSelected")}
              </Button>
            </div>
          </div>
          <CompareAddSearch />
        </div>
      </div>
    </>
  );
}
