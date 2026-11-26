"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LocalizedLink } from "@/components/localized-link";
import { ROUTES } from "@/lib/constants";

/** Avatar shortcut in the phone app bar so profile info is always one tap away. */
export function MobileProfileChip({
  name,
  image,
  label,
}: {
  name: string;
  image?: string | null;
  label: string;
}) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U";

  return (
    <LocalizedLink
      href={ROUTES.account}
      aria-label={label}
      className="focus-visible:ring-primary grid size-9 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2"
    >
      <Avatar className="size-8 border border-border/70">
        {image ? <AvatarImage src={image} alt={name} /> : null}
        <AvatarFallback className="bg-brand-soft text-brand text-[11px] font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
    </LocalizedLink>
  );
}
