import Link from "next/link";
import { ChevronRight, ShieldCheck, User as UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function profileInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U"
  );
}

/** Compact signed-in identity card for authenticated mobile screens. */
export function MobileProfileCard({
  name,
  email,
  image,
  role,
  verified,
  verifiedLabel,
  unverifiedLabel,
  profileHref,
  title,
  description,
  dark = false,
  badgeLabel,
}: {
  name: string;
  email: string;
  image?: string | null;
  role?: string;
  verified?: boolean;
  verifiedLabel?: string;
  unverifiedLabel?: string;
  profileHref?: string;
  title?: string;
  description?: string;
  dark?: boolean;
  badgeLabel?: string;
}) {
  const content = (
    <div className="flex items-center gap-3">
      <Avatar className={cn("shrink-0", dark ? "size-12" : "size-12")}>
        {image ? <AvatarImage src={image} alt={name} /> : null}
        <AvatarFallback className="bg-brand-soft text-brand text-sm font-semibold">
          {profileInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-semibold",
            dark ? "text-white" : "text-foreground",
          )}
        >
          {title ?? name}
        </p>
        <p
          dir="ltr"
          className={cn(
            "truncate text-xs",
            dark ? "text-slate-400" : "text-muted-foreground",
          )}
        >
          {description ?? email}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {role ? (
            dark ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                <ShieldCheck aria-hidden="true" className="size-3" />
                {role}
              </span>
            ) : (
              <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[10px]">
                <UserIcon aria-hidden="true" className="size-3" />
                {role}
              </Badge>
            )
          ) : null}
          {verifiedLabel || unverifiedLabel ? (
            dark ? (
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  verified
                    ? "border-emerald-400/20 text-emerald-300"
                    : "border-amber-400/20 text-amber-300",
                )}
              >
                {verified ? verifiedLabel : unverifiedLabel}
              </span>
            ) : (
              <Badge
                variant="outline"
                className={cn(
                  "px-2 py-0.5 text-[10px]",
                  verified
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-amber-700 dark:text-amber-300",
                )}
              >
                {verified ? verifiedLabel : unverifiedLabel}
              </Badge>
            )
          ) : null}
          {badgeLabel ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                dark
                  ? "bg-white/10 text-slate-300"
                  : "bg-brand-soft text-brand",
              )}
            >
              {badgeLabel}
            </span>
          ) : null}
        </div>
      </div>
      {profileHref ? (
        <ChevronRight
          aria-hidden="true"
          className={cn("size-5 shrink-0", dark ? "text-slate-500" : "text-muted-foreground")}
        />
      ) : null}
    </div>
  );

  const className = cn(
    "rounded-2xl border p-4 md:hidden",
    dark ? "border-white/10 bg-[#1F1F1F]" : "border-border/70 bg-card",
  );

  return profileHref ? (
    <Link href={profileHref} className={cn(className, "block transition-colors hover:bg-accent/40")}>
      {content}
    </Link>
  ) : (
    <section className={className}>{content}</section>
  );
}
