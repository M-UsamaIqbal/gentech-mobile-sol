"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { APP, ROUTES } from "@/lib/constants";
import { LocalizedLink } from "@/components/localized-link";
import { useLocalizedRouteInfo } from "@/lib/localized-routing";
import type { CategoryItem } from "@/types/marketplace";
import { Button, buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { CategoryIcon } from "@/features/marketplace/components/category-icon";
import { CountryLocaleSelector } from "@/components/country-locale-selector";

interface MobileNavProps {
  categories: CategoryItem[];
  isAuthenticated: boolean;
}

const PANEL_ID = "mobile-navigation-panel";

export function MobileNav({ categories, isAuthenticated }: MobileNavProps) {
  const t = useTranslations("navigation");
  const tCategories = useTranslations("categories");
  const tCommon = useTranslations("common");
  const { locale } = useLocalizedRouteInfo();
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const isRtl = locale === "ar" || locale === "ur";
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  const linkClass = (href: string) =>
    cn(
      "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
      pathname.includes(href)
        ? "bg-accent text-accent-foreground"
        : "hover:bg-accent hover:text-accent-foreground",
    );

  const item = (index: number) => ({
    initial: { opacity: 0, y: reducedMotion ? 0 : 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: reducedMotion ? 0 : 12 },
    transition: {
      duration: reducedMotion ? 0.2 : 0.5,
      delay: reducedMotion ? 0 : Math.min(index * 0.06, 0.4),
      ease: [0.22, 1, 0.36, 1] as const,
    },
  });

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label={t("categories")}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen(true)}
      >
        <span className="relative block size-5" aria-hidden="true">
          <motion.span
            className="bg-foreground absolute inset-x-0 top-1 h-0.5 rounded-full"
            animate={open ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.span
            className="bg-foreground absolute inset-x-0 bottom-1 h-0.5 rounded-full"
            animate={open ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
        </span>
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              aria-label={tCommon("close")}
              tabIndex={-1}
              className="bg-background/80 absolute inset-0 backdrop-blur-sm"
              onClick={close}
            />
            <motion.aside
              ref={panelRef}
              id={PANEL_ID}
              role="dialog"
              aria-modal="true"
              aria-label={t("categories")}
              className="bg-background/95 absolute inset-0 flex h-full w-full flex-col backdrop-blur-2xl"
              initial={{ x: isRtl ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? "100%" : "-100%" }}
              transition={{ type: "tween", duration: reducedMotion ? 0.2 : 0.5, ease: [0.22, 1, 0.36, 1] }}
              onClickCapture={(event) => {
                if ((event.target as HTMLElement).closest("a")) close();
              }}
            >
              <div className="flex items-center justify-between gap-3 border-b px-4 py-4">
                <LocalizedLink href={ROUTES.home} className="flex items-center gap-2 font-semibold">
                  <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg text-sm font-semibold">
                    {APP.name.charAt(0)}
                  </span>
                  {APP.name}
                </LocalizedLink>
                <div className="flex items-center gap-2">
                  <CountryLocaleSelector />
                  <Button
                    ref={closeRef}
                    variant="ghost"
                    size="icon"
                    aria-label={tCommon("close")}
                    onClick={close}
                  >
                    <span className="relative block size-5" aria-hidden="true">
                      <span className="bg-foreground absolute inset-x-0 top-2.5 h-0.5 rotate-45 rounded-full" />
                      <span className="bg-foreground absolute inset-x-0 top-2.5 h-0.5 -rotate-45 rounded-full" />
                    </span>
                  </Button>
                </div>
              </div>

              <nav aria-label={t("navigation")} className="flex-1 overflow-y-auto px-4 py-5">
                <motion.div {...item(0)}>
                  <LocalizedLink href={ROUTES.marketplace} className={linkClass(ROUTES.marketplace)}>
                    {t("marketplace")}
                  </LocalizedLink>
                </motion.div>
                <motion.div {...item(1)}>
                  <LocalizedLink
                    href={ROUTES.inspectionService}
                    className={linkClass(ROUTES.inspectionService)}
                  >
                    <ShieldCheck className="text-muted-foreground size-4" />
                    {t("inspection")}
                  </LocalizedLink>
                </motion.div>

                <motion.p
                  {...item(2)}
                  className="text-muted-foreground mt-6 px-3 pb-2 text-xs font-semibold uppercase tracking-wide"
                >
                  {t("categories")}
                </motion.p>
                <ul className="space-y-1">
                  {categories.map((category, index) => (
                    <motion.li key={category.id} {...item(index + 3)}>
                      <LocalizedLink
                        href={`/marketplace?category=${category.slug}`}
                        className="hover:bg-accent flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm"
                      >
                        <CategoryIcon
                          name={category.icon}
                          className="text-muted-foreground size-4"
                        />
                        {tCategories.has(category.slug)
                          ? tCategories(category.slug)
                          : category.name}
                      </LocalizedLink>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              <div className="grid gap-2 border-t p-4 sm:grid-cols-2">
                <LocalizedLink
                  href={ROUTES.sell}
                  className={cn(buttonVariants(), "min-h-11 rounded-lg")}
                >
                  <Plus className="size-4" />
                  {t("sell")}
                </LocalizedLink>
                <LocalizedLink
                  href={isAuthenticated ? ROUTES.dashboard : ROUTES.signIn}
                  className={cn(buttonVariants({ variant: "outline" }), "min-h-11 rounded-lg")}
                >
                  {isAuthenticated ? t("dashboard") : t("signIn")}
                </LocalizedLink>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
