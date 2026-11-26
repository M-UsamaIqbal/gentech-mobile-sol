import { MessagesSquare, Search, Tag } from "lucide-react";

import { getServerTranslations } from "@/lib/i18n/get-server-translations";

const STEPS = [
  { icon: Search, key: "step1" },
  { icon: MessagesSquare, key: "step2" },
  { icon: Tag, key: "step3" },
] as const;

export async function HowItWorks() {
  const t = await getServerTranslations("howItWorks");
  const tHome = await getServerTranslations("homepage");

  return (
    <section className="border-y border-brand/10 bg-brand-soft/60">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="mx-auto max-w-[680px] text-center">
          <h2 className="heading-4">{t("title")}</h2>
          <p className="text-muted-foreground mt-3 text-sm">{tHome("howItWorksLead")}</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, key }, i) => (
            <article key={key} className="bg-card rounded-xl border p-5">
              <div className="flex items-center gap-3">
                <span className="bg-brand text-brand-foreground grid size-10 place-items-center rounded-lg">
                  <Icon className="size-5" />
                </span>
                <span className="text-brand text-xs font-semibold">0{i + 1}</span>
              </div>
              <h3 className="title-3 mt-4">{t(`${key}Title`)}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{t(`${key}Body`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
