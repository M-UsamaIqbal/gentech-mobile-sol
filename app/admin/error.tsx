"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, LayoutDashboard, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[admin] page failed to render.", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50svh] max-w-lg items-center justify-center py-10">
      <section
        role="alert"
        className="w-full rounded-2xl border border-rose-400/20 bg-[#1F1F1F] p-5 text-center sm:p-7"
      >
        <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-rose-400/10 text-rose-300">
          <AlertCircle className="size-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-slate-100">This page didn’t load</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Something went wrong while loading this workspace. Try again, or return to the admin
          overview.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-slate-500">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <Button className="min-h-10" onClick={reset}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </Button>
          <Button variant="outline" className="min-h-10" render={<Link href="/admin" />}>
            <LayoutDashboard className="size-4" aria-hidden="true" />
            Admin overview
          </Button>
        </div>
      </section>
    </div>
  );
}
