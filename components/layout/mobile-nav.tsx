"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Plus, ShieldCheck, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { APP, ROUTES } from "@/lib/constants";
import type { CategoryItem } from "@/types/marketplace";
import { Button, buttonVariants } from "@/components/ui/button";
import { CategoryIcon } from "@/features/marketplace/components/category-icon";

interface MobileNavProps {
  categories: CategoryItem[];
  isAuthenticated: boolean;
}

export function MobileNav({ categories, isAuthenticated }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);

  // Lock body scroll while open.
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              aria-label="Close menu"
              className="bg-background/80 absolute inset-0 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="bg-background absolute inset-y-0 left-0 flex w-80 max-w-[85%] flex-col border-r shadow-xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              // Close the drawer when any link inside is activated.
              onClickCapture={(e) => {
                if ((e.target as HTMLElement).closest("a")) setOpen(false);
              }}
            >
              <div className="flex items-center justify-between border-b p-4">
                <Link href={ROUTES.home} className="flex items-center gap-2 font-semibold">
                  <span className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-md text-sm font-bold">
                    {APP.name.charAt(0)}
                  </span>
                  {APP.name}
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                >
                  <X className="size-5" />
                </Button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4">
                <Link
                  href={ROUTES.marketplace}
                  className="hover:bg-accent block rounded-md px-3 py-2 text-sm font-medium"
                >
                  Browse all listings
                </Link>
                <Link
                  href={ROUTES.inspectionService}
                  className="hover:bg-accent flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium"
                >
                  <ShieldCheck className="text-muted-foreground size-4" />
                  Phone Inspection
                </Link>

                <p className="text-muted-foreground mt-4 px-3 text-xs font-semibold uppercase">
                  Categories
                </p>
                <ul className="mt-1 space-y-0.5">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`${ROUTES.marketplace}?category=${category.slug}`}
                        className="hover:bg-accent flex items-center gap-3 rounded-md px-3 py-2 text-sm"
                      >
                        <CategoryIcon
                          name={category.icon}
                          className="text-muted-foreground size-4"
                        />
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="space-y-2 border-t p-4">
                <Link href={ROUTES.sell} className={cn(buttonVariants(), "w-full")}>
                  <Plus className="size-4" />
                  Post your ad
                </Link>
                {!isAuthenticated ? (
                  <Link
                    href={ROUTES.signIn}
                    className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                  >
                    Sign in
                  </Link>
                ) : (
                  <Link
                    href={ROUTES.dashboard}
                    className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                  >
                    Go to dashboard
                  </Link>
                )}
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
