"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Bookmark,
  ClipboardCheck,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { signOut } from "@/lib/auth-client";
import { identify, resetAnalytics } from "@/features/analytics/lib/client";
import { ROUTES, USER_ROLES, type UserRole } from "@/lib/constants";
import { useLocalizedHref } from "@/lib/localized-routing";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  userId: string;
  name: string;
  email: string;
  image?: string | null;
  role: UserRole | "DEALER";
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U"
  );
}

export function UserMenu({ userId, name, email, image, role }: UserMenuProps) {
  const router = useRouter();
  const t = useTranslations("navigation");
  const tCommon = useTranslations("common");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    identify(userId, { role });
  }, [role, userId]);

  const homeHref = useLocalizedHref(ROUTES.home);
  const dashboardHref = useLocalizedHref(ROUTES.dashboard);
  const listingsHref = useLocalizedHref(ROUTES.myListings);
  const messagesHref = useLocalizedHref(ROUTES.messages);
  const favoritesHref = useLocalizedHref(ROUTES.favorites);
  const savedSearchesHref = useLocalizedHref(ROUTES.savedSearches);
  const inspectionsHref = useLocalizedHref(ROUTES.inspections);
  const accountHref = useLocalizedHref(ROUTES.account);
  const inspectorHref = useLocalizedHref(ROUTES.inspector);
  const adminHref = useLocalizedHref(ROUTES.admin);

  async function handleSignOut() {
    setPending(true);
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          resetAnalytics();
          router.push(homeHref);
          router.refresh();
        },
        onError: () => {
          toast.error(t("logout"));
          setPending(false);
        },
      },
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label={t("account")}
          />
        }
      >
        <Avatar className="size-8">
          {image ? <AvatarImage src={image} alt={name} /> : null}
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <span className="truncate font-medium">{name}</span>
            <span className="text-muted-foreground truncate text-xs font-normal">{email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={dashboardHref} />}>
          <LayoutDashboard className="size-4" />
          {t("dashboard")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={listingsHref} />}>
          <Package className="size-4" />
          {t("myListings")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={messagesHref} />}>
          <MessageSquare className="size-4" />
          {t("messages")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={favoritesHref} />}>
          <Heart className="size-4" />
          {t("favorites")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={savedSearchesHref} />}>
          <Bookmark className="size-4" />
          {t("savedSearches")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={inspectionsHref} />}>
          <ShieldCheck className="size-4" />
          {t("inspections")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={accountHref} />}>
          <UserIcon className="size-4" />
          {t("profile")}
        </DropdownMenuItem>
        {role === USER_ROLES.INSPECTOR || role === USER_ROLES.ADMIN ? (
          <DropdownMenuItem render={<Link href={inspectorHref} />}>
            <ClipboardCheck className="size-4" />
            {t("inspector")}
          </DropdownMenuItem>
        ) : null}
        {role === USER_ROLES.ADMIN ? (
          <DropdownMenuItem render={<Link href={adminHref} />}>
            <LayoutDashboard className="size-4" />
            {t("admin")}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => event.preventDefault()}
          disabled={pending}
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          {pending ? tCommon("loading") : t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
