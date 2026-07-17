"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderTree, Flag, LayoutDashboard, Package, ShieldCheck, Users } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: ROUTES.admin, label: "Overview", icon: LayoutDashboard, exact: true },
  { href: ROUTES.adminUsers, label: "Users", icon: Users, exact: false },
  { href: ROUTES.adminListings, label: "Listings", icon: Package, exact: false },
  { href: ROUTES.adminReports, label: "Reports", icon: Flag, exact: false },
  { href: ROUTES.adminCategories, label: "Categories", icon: FolderTree, exact: false },
  { href: ROUTES.adminInspections, label: "Inspections", icon: ShieldCheck, exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto" aria-label="Admin sections">
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
