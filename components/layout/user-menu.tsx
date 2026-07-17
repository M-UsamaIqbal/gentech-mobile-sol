"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { signOut } from "@/lib/auth-client";
import { ROUTES, USER_ROLES, type UserRole } from "@/lib/constants";
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
  name: string;
  email: string;
  image?: string | null;
  role: UserRole;
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

export function UserMenu({ name, email, image, role }: UserMenuProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleSignOut() {
    setPending(true);
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push(ROUTES.home);
          router.refresh();
        },
        onError: () => {
          toast.error("Could not sign out. Please try again.");
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
            aria-label="Open account menu"
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
        <DropdownMenuItem render={<Link href={ROUTES.dashboard} />}>
          <LayoutDashboard className="size-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={ROUTES.myListings} />}>
          <Package className="size-4" />
          My Listings
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={ROUTES.messages} />}>
          <MessageSquare className="size-4" />
          Messages
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={ROUTES.savedSearches} />}>
          <Bookmark className="size-4" />
          Saved Searches
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={ROUTES.inspections} />}>
          <ShieldCheck className="size-4" />
          My Inspections
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={ROUTES.account} />}>
          <UserIcon className="size-4" />
          Profile
        </DropdownMenuItem>
        {role === USER_ROLES.INSPECTOR || role === USER_ROLES.ADMIN ? (
          <DropdownMenuItem render={<Link href={ROUTES.inspector} />}>
            <ClipboardCheck className="size-4" />
            Inspector
          </DropdownMenuItem>
        ) : null}
        {role === USER_ROLES.ADMIN ? (
          <DropdownMenuItem render={<Link href={ROUTES.admin} />}>
            <LayoutDashboard className="size-4" />
            Admin
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          disabled={pending}
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          {pending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
