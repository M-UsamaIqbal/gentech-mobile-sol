"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Submits a `?q=` search to the current admin page (resets pagination). */
export function AdminSearch({ placeholder = "Search…" }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = React.useState(searchParams.get("q") ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const term = value.trim();
    if (term) params.set("q", term);
    else params.delete("q");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <form
      role="search"
      aria-label="Search current admin page"
      onSubmit={onSubmit}
      className="flex w-full max-w-sm items-center gap-2"
    >
      <div className="relative min-w-0 flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-h-10 pl-9"
        />
      </div>
      <Button type="submit" variant="outline" className="min-h-10 px-3">
        <Search className="size-4" aria-hidden="true" />
        <span className="sr-only">Search</span>
      </Button>
    </form>
  );
}
