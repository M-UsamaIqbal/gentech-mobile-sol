import { BadgeCheck, MapPin, ShieldCheck } from "lucide-react";

import { getServerTranslations } from "@/lib/i18n/get-server-translations";

const SIGNALS = [
  { icon: BadgeCheck, title: "trustVerified", body: "trustVerifiedBody" },
  { icon: ShieldCheck, title: "trustInspected", body: "trustInspectedBody" },
  { icon: MapPin, title: "trustNearby", body: "trustNearbyBody" },
] as const;

export async function TrustStrip() {
  const t = await getServerTranslations("homepage");

  return (
    <section aria-label={t("trustTitle")} className="border-b border-brand/10 bg-brand-soft/60">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-3 sm:gap-6">
        {SIGNALS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex items-center gap-3">
            <span className="border-brand/15 bg-background text-brand grid size-10 shrink-0 place-items-center rounded-lg border">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="title-4">{t(title)}</p>
              <p className="caption-4 text-muted-foreground">{t(body)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
