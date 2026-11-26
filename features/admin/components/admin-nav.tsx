"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  BarChart3,
  ChevronDown,
  BellRing,
  CreditCard,
  FileStack,
  FolderTree,
  LayoutDashboard,
  Menu,
  MapPin,
  Megaphone,
  MessageSquareText,
  Package,
  ShoppingCart,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Smartphone,
  Store,
  Tag,
  Users,
} from "lucide-react";

import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const ADMIN_NAV_GROUPS = [
  {
    label: "Workspace",
    links: [{ href: ROUTES.admin, label: "Overview", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Marketplace",
    links: [
      { href: ROUTES.adminUsers, label: "Customers", icon: Users },
      { href: ROUTES.adminListings, label: "Listings", icon: Package },
      { href: "/admin/brands", label: "Brands", icon: Tag },
      { href: "/admin/models", label: "Phone Models & Specs", icon: Smartphone },
      { href: "/admin/locations", label: "Locations & Cities", icon: MapPin },
      { href: "/admin/orders", label: "Orders & fulfilment", icon: ShoppingCart },
      { href: "/admin/shipments", label: "Shipping & handover", icon: ShoppingCart },
      { href: "/admin/dealers", label: "Dealers", icon: Store },
      { href: "/admin/promotions", label: "Promotions", icon: Tag },
      { href: "/admin/discounts", label: "Discounts & vouchers", icon: Tag },
      { href: ROUTES.adminReports, label: "Trust & safety", icon: ShieldCheck },
      { href: ROUTES.adminCategories, label: "Catalog", icon: FolderTree },
      { href: ROUTES.adminInspections, label: "Inspections", icon: ShieldCheck },
      { href: ROUTES.adminQuotes, label: "Quotes", icon: Smartphone },
    ],
  },
  {
    label: "Growth",
    links: [
      { href: "/admin/marketing", label: "Marketing & leads", icon: Megaphone },
      { href: "/admin/blogs", label: "Editorial", icon: BookOpen },
      { href: "/admin/analytics", label: "Business analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Finance & ERP",
    links: [{ href: "/admin/finance", label: "Finance center", icon: CreditCard }],
  },
  {
    label: "Operations",
    links: [{ href: "/admin/support", label: "Customer support", icon: MessageSquareText }],
  },
  {
    label: "Platform",
    links: [{ href: "/admin/communications", label: "Notifications & email", icon: BellRing }],
  },
  {
    label: "Governance",
    links: [
      { href: "/admin/access", label: "Staff access", icon: Users },
      { href: "/admin/security", label: "Security center", icon: ShieldCheck },
      { href: "/admin/audit", label: "Audit trail", icon: ReceiptText },
      { href: "/admin/settings", label: "Marketplace settings", icon: Settings2 },
      { href: "/admin/integrations", label: "System integrations", icon: FileStack },
    ],
  },
];

function AdminGroupList({ pathname }: { pathname: string }) {
  return (
    <>
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-2">
          <p className="px-3 text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.links.map((link) => {
              const { href, label, icon: Icon } = link;
              const active =
                "exact" in link && link.exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={(event) => {
                    event.currentTarget.closest("details")?.removeAttribute("open");
                  }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-emerald-400 font-semibold text-slate-950"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-[#181818] text-slate-300 md:sticky md:top-0 md:h-svh md:w-64 md:border-r md:border-b-0">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4 md:h-[72px] md:px-6">
        <Link href={ROUTES.admin} className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-400 text-sm font-bold text-slate-950">
            G
          </span>
          <span>
            <span className="block text-sm font-bold tracking-wide text-white">GenTech</span>
            <span className="block text-xs text-slate-400">Operations workspace</span>
          </span>
        </Link>

        <details className="group relative md:hidden">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-medium text-slate-200 transition-colors hover:bg-white/[0.06] [&::-webkit-details-marker]:hidden">
            <Menu className="size-4" />
            Menu
            <ChevronDown className="size-3.5 text-slate-500 transition-transform group-open:rotate-180" />
          </summary>
          <nav
            className="absolute top-12 right-0 z-30 max-h-[75svh] w-[min(22rem,calc(100vw-2rem))] space-y-6 overflow-y-auto rounded-xl border border-white/10 bg-[#181818] p-3 shadow-2xl shadow-black/50"
            aria-label="Admin sections"
          >
            <AdminGroupList pathname={pathname} />
            <Link
              href="/"
              className="flex items-center justify-between border-t border-white/10 px-3 pt-4 text-xs font-medium text-slate-400 transition-colors hover:text-white"
            >
              View marketplace <ArrowUpRight className="size-4" />
            </Link>
          </nav>
        </details>
      </div>

      <nav
        className="hidden flex-1 space-y-7 overflow-y-auto px-3 py-6 md:block"
        aria-label="Admin sections"
      >
        <AdminGroupList pathname={pathname} />
      </nav>

      <Link
        href="/"
        className="hidden items-center justify-between border-t border-white/10 px-6 py-5 text-xs font-medium text-slate-400 transition-colors hover:text-white md:flex"
      >
        View marketplace <ArrowUpRight className="size-4" />
      </Link>
    </aside>
  );
}
