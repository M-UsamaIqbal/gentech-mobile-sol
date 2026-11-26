import { ArrowRight } from "lucide-react";

import { getServerTranslations } from "@/lib/i18n/get-server-translations";
import { cn } from "@/lib/utils";
import { LocalizedLink } from "@/components/localized-link";
import { buttonVariants } from "@/components/ui/button";

export async function CtaBand() {
  const t = await getServerTranslations("cta");

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="bg-brand text-brand-foreground rounded-2xl p-8 text-center sm:p-12">
        <h2 className="heading-4">{t("title")}</h2>
        <p className="body-3 mx-auto mt-4 max-w-[680px] text-brand-foreground/85">{t("body")}</p>
        <LocalizedLink
          href="/sell"
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-6 rounded-lg bg-background text-brand hover:bg-background/90",
          )}
        >
          {t("button")}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </LocalizedLink>
      </div>
    </section>
  );
}
