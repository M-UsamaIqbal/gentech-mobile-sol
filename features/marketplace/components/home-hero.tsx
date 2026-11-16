import Link from "next/link";
import { BadgeCheck, ShieldCheck, Sparkles, Tag } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import type { CategoryItem } from "@/types/marketplace";
import { SearchBar } from "./search-bar";

const TRUST_POINTS = [
  { icon: Tag, label: "Free to post" },
  { icon: BadgeCheck, label: "Verified sellers" },
  { icon: ShieldCheck, label: "Buyer inspections" },
];

export function HomeHero({ popularCategories }: { popularCategories: CategoryItem[] }) {
  return (
    <section className="relative overflow-hidden border-b">
      {/* Soft emerald radial wash + a faint grid for depth. */}
      <div className="bg-primary/10 pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(75%_60%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
        <span className="border-primary/20 bg-primary/10 text-primary mx-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
          <Sparkles className="size-3.5" />
          Pakistan&apos;s mobile marketplace
        </span>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-5xl">
          Find your next phone,{" "}
          <span className="text-primary">near you.</span>
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base text-pretty sm:text-lg">
          Thousands of phones and accessories from trusted sellers across Pakistan.
        </p>

        <div className="mx-auto mt-8 max-w-2xl">
          <SearchBar variant="hero" />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-muted-foreground text-sm">Popular:</span>
          {popularCategories.slice(0, 5).map((category) => (
            <Link
              key={category.id}
              href={`${ROUTES.marketplace}?category=${category.slug}`}
              className="bg-muted hover:bg-accent hover:text-accent-foreground rounded-full px-3 py-1 text-sm font-medium transition-colors"
            >
              {category.name}
            </Link>
          ))}
        </div>

        <ul className="text-muted-foreground mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          {TRUST_POINTS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-1.5">
              <Icon className="text-primary size-4" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
