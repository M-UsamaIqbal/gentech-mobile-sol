import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto flex min-h-svh max-w-3xl flex-col items-start justify-center gap-6 px-4 py-16">
      <p className="caption-3 text-muted-foreground uppercase tracking-wide">404</p>
      <h1 className="heading-2">We could not find that page.</h1>
      <p className="body-3 text-muted-foreground max-w-[680px]">
        The link may be out of date, or the listing may have been removed. Head back to the
        marketplace and keep looking.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href={ROUTES.marketplace} className={buttonVariants()}>
          Browse the marketplace
        </Link>
        <Link href={ROUTES.home} className={buttonVariants({ variant: "outline" })}>
          Go home
        </Link>
      </div>
    </main>
  );
}
