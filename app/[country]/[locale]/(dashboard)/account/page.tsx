import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  Bookmark,
  Heart,
  MessageSquare,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  User as UserIcon,
} from "lucide-react";

import {
  getCountryFromParam,
  getLocaleFromParam,
} from "@/lib/countries/server";
import { ROUTES, USER_ROLES, type UserRole } from "@/lib/constants";
import { withCountryLocalePrefix } from "@/lib/localized-path";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MobileProfileCard, profileInitials } from "@/components/layout/mobile-profile-card";
import { MobileQuickActions } from "@/components/layout/mobile-quick-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AccountForm } from "./account-form";

type PageProps = { params: Promise<{ country: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country, locale } = await params;
  const countryCode = getCountryFromParam(country);
  const resolvedLocale = getLocaleFromParam(locale, countryCode);
  const t = await getTranslations({ locale: resolvedLocale, namespace: "profile" });
  return { title: t("myProfile"), robots: { index: false, follow: false } };
}

export default async function AccountPage({ params }: PageProps) {
  const { country, locale: localeParam } = await params;
  const countryCode = getCountryFromParam(country);
  const locale = getLocaleFromParam(localeParam, countryCode);
  const t = await getTranslations({ locale, namespace: "accountPage" });
  const tNav = await getTranslations({ locale, namespace: "navigation" });

  const session = await getCurrentSession();
  if (!session) {
    redirect(withCountryLocalePrefix(ROUTES.signIn, countryCode, locale));
  }

  const { user } = session;
  const role = (user.role as UserRole | undefined) ?? USER_ROLES.USER;
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } }).catch(() => null);

  const labels = {
    fullName: t("fullName"),
    phoneNumber: t("phoneNumber"),
    phoneHint: t("phoneHint"),
    city: t("city"),
    cityPlaceholder: t("cityPlaceholder", { city: t("cityExample") }),
    bio: t("bio"),
    bioHint: t("bioHint"),
    personalInfo: t("personalInfo"),
    aboutYou: t("aboutYou"),
    accountActions: t("accountActions"),
    editDescription: t("editDescription"),
    saveChanges: t("saveChanges"),
    saving: t("saving"),
    signOut: t("signOut"),
    signingOut: t("signingOut"),
    saved: t("saved"),
    saveFailed: t("saveFailed"),
    signOutFailed: t("signOutFailed"),
  };

  const localHref = (href: string) => withCountryLocalePrefix(href, countryCode, locale);
  const mobileActions = [
    { href: localHref(ROUTES.myListings), label: tNav("myListings"), icon: Package, tone: "brand" as const },
    { href: localHref(ROUTES.orders), label: tNav("orders"), icon: ShoppingBag, tone: "sky" as const },
    { href: localHref(ROUTES.favorites), label: tNav("favorites"), icon: Heart, tone: "rose" as const },
    { href: localHref(ROUTES.messages), label: tNav("messages"), icon: MessageSquare, tone: "violet" as const },
    { href: localHref(ROUTES.savedSearches), label: tNav("savedSearches"), icon: Bookmark, tone: "amber" as const },
    { href: localHref(ROUTES.inspections), label: tNav("inspections"), icon: ShieldCheck, tone: "emerald" as const },
    { href: localHref(ROUTES.sell), label: tNav("sell"), icon: Plus, tone: "brand" as const },
    { href: localHref(ROUTES.notifications), label: tNav("notifications"), icon: ShieldCheck, tone: "sky" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4 md:hidden">
        <MobileProfileCard
          name={user.name}
          email={user.email}
          image={user.image}
          role={role}
          verified={user.emailVerified}
          verifiedLabel={t("emailVerified")}
          unverifiedLabel={t("emailNotVerified")}
          title={user.name}
          description={user.email}
        />
        <MobileQuickActions actions={mobileActions} label={tNav("account")} />
      </div>

      <div className="hidden space-y-6 md:block">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </header>

        <Card>
          <CardContent className="flex flex-wrap items-center gap-4 pt-6">
            <Avatar className="size-16">
              {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
              <AvatarFallback className="text-lg">{profileInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-lg font-semibold leading-none">{user.name}</p>
              <p className="text-muted-foreground text-sm" dir="ltr">{user.email}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant={role === USER_ROLES.ADMIN ? "default" : "secondary"}>
                  {role === USER_ROLES.ADMIN ? (
                    <ShieldCheck className="size-3" />
                  ) : (
                    <UserIcon className="size-3" />
                  )}
                  {role}
                </Badge>
                <Badge variant="outline" className="text-green-600 dark:text-green-400">
                  {user.emailVerified ? t("emailVerified") : t("emailNotVerified")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3 md:hidden">
        <div className="px-1">
          <h2 className="text-base font-semibold">{t("editProfile")}</h2>
          <p className="text-muted-foreground text-xs">{t("editDescription")}</p>
        </div>
        <AccountForm
          variant="mobile"
          name={user.name}
          bio={profile?.bio ?? ""}
          phone={profile?.phone ?? ""}
          city={profile?.city ?? ""}
          labels={labels}
        />
      </div>

      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>{t("editProfile")}</CardTitle>
          <CardDescription>{t("editDescription")}</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <AccountForm
            variant="desktop"
            name={user.name}
            bio={profile?.bio ?? ""}
            phone={profile?.phone ?? ""}
            city={profile?.city ?? ""}
            labels={labels}
          />
        </CardContent>
      </Card>
    </div>
  );
}
