"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { APP } from "@/lib/constants";

const SPLASH_DURATION_MS = 900;
const REDUCED_MOTION_DURATION_MS = 150;

/** Brief branded launch screen for phone viewports; hidden at md and above. */
export function MobileSplashScreen() {
  const t = useTranslations("common");
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(
      () => setVisible(false),
      prefersReducedMotion ? REDUCED_MOTION_DURATION_MS : SPLASH_DURATION_MS,
    );

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      data-mobile-splash
      role="status"
      aria-live="polite"
      aria-label={`${APP.name} — ${t("loading")}`}
      className="bg-background fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden px-6 text-center md:hidden"
    >
      <span aria-hidden="true" className="mobile-splash-glow bg-brand/10 blur-3xl" />
      <div className="relative flex w-full max-w-xs flex-col items-center">
        <div className="relative grid place-items-center">
          <span aria-hidden="true" className="mobile-splash-ring border-brand/30 absolute -inset-4 rounded-[2rem] border" />
          <span className="bg-brand text-brand-foreground shadow-brand/25 grid size-20 place-items-center rounded-[1.75rem] text-3xl font-bold shadow-2xl">
            {APP.name.charAt(0)}
          </span>
        </div>

        <p className="mt-7 text-xl font-semibold tracking-tight">{APP.name}</p>
        <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">{APP.description}</p>

        <div className="bg-brand-soft mt-7 h-1 w-32 overflow-hidden rounded-full">
          <span aria-hidden="true" className="mobile-splash-progress bg-brand block h-full w-full rounded-full" />
        </div>
        <p className="text-muted-foreground mt-3 text-[11px] font-medium">{t("loading")}</p>
      </div>
    </div>
  );
}
