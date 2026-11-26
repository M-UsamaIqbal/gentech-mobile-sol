"use client";

import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import { LocalizedLink } from "@/components/localized-link";
import { cn } from "@/lib/utils";

/** Localized link that marks the current section for assistive technology and styling. */
export function ActiveLocalizedLink({
  href,
  className,
  ...props
}: ComponentProps<typeof LocalizedLink>) {
  const pathname = usePathname();
  const target = typeof href === "string" ? href : "";
  const isActive = target.length > 1 && pathname.includes(target);

  return (
    <LocalizedLink
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(isActive && "bg-accent text-accent-foreground", className)}
      {...props}
    />
  );
}
