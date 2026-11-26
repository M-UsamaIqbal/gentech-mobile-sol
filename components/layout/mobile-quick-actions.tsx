import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type MobileQuickAction = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  tone?: "brand" | "emerald" | "sky" | "violet" | "amber" | "rose";
};

const TONE_CLASSES: Record<NonNullable<MobileQuickAction["tone"]>, string> = {
  brand: "bg-brand-soft text-brand",
  emerald: "bg-emerald-400/10 text-emerald-700 dark:text-emerald-300",
  sky: "bg-sky-400/10 text-sky-700 dark:text-sky-300",
  violet: "bg-violet-400/10 text-violet-700 dark:text-violet-300",
  amber: "bg-amber-400/10 text-amber-700 dark:text-amber-300",
  rose: "bg-rose-400/10 text-rose-700 dark:text-rose-300",
};

/** App-style shortcut grid used on signed-in mobile screens. */
export function MobileQuickActions({
  actions,
  label,
  dark = false,
}: {
  actions: readonly MobileQuickAction[];
  label: string;
  dark?: boolean;
}) {
  return (
    <nav aria-label={label} className="md:hidden">
      <ul className="grid grid-cols-4 gap-2">
        {actions.map(({ href, label: actionLabel, icon: Icon, badge, tone = "brand" }) => (
          <li key={`${href}-${actionLabel}`}>
            <Link
              href={href}
              className={cn(
                "relative flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-1.5 py-3 text-center transition-colors",
                dark
                  ? "border-white/[0.08] bg-[#1F1F1F] hover:border-emerald-400/30 hover:bg-[#24262c]"
                  : "border-border/70 bg-card hover:border-brand/40 hover:bg-accent/40",
              )}
            >
              <span
                className={cn(
                  "grid size-10 place-items-center rounded-xl",
                  dark
                    ? "bg-emerald-400/10 text-emerald-300"
                    : TONE_CLASSES[tone],
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span
                className={cn(
                  "w-full truncate text-[11px] leading-tight font-medium",
                  dark ? "text-slate-300" : "text-foreground",
                )}
              >
                {actionLabel}
              </span>
              {badge !== undefined && badge !== "" && badge !== 0 ? (
                <span className="bg-brand text-brand-foreground absolute top-1.5 end-1.5 grid min-w-5 place-items-center rounded-full px-1 text-[10px] leading-5 font-bold">
                  {badge}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
