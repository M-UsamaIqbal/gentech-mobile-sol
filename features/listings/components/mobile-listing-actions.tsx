import { getServerTranslations } from "@/lib/i18n/get-server-translations";
import { formatPrice } from "@/utils/format";
import { ContactSeller } from "./contact-seller";

/**
 * Fixed price + chat strip for phone-sized listing screens. It sits directly above
 * the global bottom tab bar and is removed entirely at the desktop breakpoint.
 */
export async function MobileListingActions({
  price,
  currency,
  locale,
  listingId,
  listingTitle,
  isAuthenticated,
}: {
  price: number;
  currency: string;
  locale: string;
  listingId: string;
  listingTitle: string;
  isAuthenticated: boolean;
}) {
  const t = await getServerTranslations("listings");

  return (
    <div
      className="border-border/70 bg-background/95 fixed inset-x-0 z-30 border-t px-3 py-2 shadow-[0_-4px_18px_rgba(0,0,0,0.06)] backdrop-blur-xl md:hidden"
      style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
      role="region"
      aria-label={t("price")}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[11px] leading-none">{t("price")}</p>
          <p className="text-brand mt-1 truncate text-lg leading-none font-semibold">
            {formatPrice(price, { currency, locale })}
          </p>
        </div>
        <div className="w-40 shrink-0">
          <ContactSeller
            listingId={listingId}
            listingTitle={listingTitle}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
    </div>
  );
}
