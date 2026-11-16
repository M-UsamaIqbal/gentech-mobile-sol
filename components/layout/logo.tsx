import Link from "next/link";
import { Smartphone } from "lucide-react";

import { APP, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Wrap in a link to a destination. Pass `null` to render a plain mark (no link). */
  href?: string | null;
  /** Hide the wordmark (icon-only). */
  showText?: boolean;
  className?: string;
  /** Tailwind size of the icon badge. */
  size?: "sm" | "md" | "lg";
}

const BADGE_SIZE = { sm: "size-7", md: "size-8", lg: "size-9" } as const;
const ICON_SIZE = { sm: "size-4", md: "size-5", lg: "size-5" } as const;
const TEXT_SIZE = { sm: "text-sm", md: "text-base", lg: "text-lg" } as const;

/**
 * Brand mark: a smartphone glyph in an emerald gradient badge + the wordmark.
 * Shared by the header, mobile drawer and footer so the brand stays consistent.
 */
export function Logo({ href = ROUTES.home, showText = true, className, size = "md" }: LogoProps) {
  const mark = (
    <span className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span
        className={cn(
          "grid place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm shadow-emerald-600/30 ring-1 ring-emerald-700/20",
          BADGE_SIZE[size],
        )}
      >
        <Smartphone className={ICON_SIZE[size]} strokeWidth={2.4} aria-hidden />
      </span>
      {showText ? (
        <span className={cn("leading-none", TEXT_SIZE[size])}>
          {APP.name}
          <span className="text-primary">.</span>
        </span>
      ) : null}
    </span>
  );

  if (href === null) return mark;
  return (
    <Link href={href} className="shrink-0" aria-label={APP.name}>
      {mark}
    </Link>
  );
}
