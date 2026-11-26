"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-svh max-w-3xl flex-col items-start justify-center gap-6 px-4 py-16"
    >
      <p className="caption-3 text-muted-foreground uppercase tracking-wide">Something went wrong</p>
      <h1 className="heading-2">We could not load this page.</h1>
      <p className="body-3 text-muted-foreground max-w-[680px]">
        Try again. If the problem continues, go back to the marketplace and start there.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Go home
        </Link>
      </div>
    </main>
  );
}
