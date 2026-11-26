import type { Metadata } from "next";
import Link from "next/link";
import { BellRing, Globe2, Mail, MapPin, ShieldCheck, SlidersHorizontal } from "lucide-react";

export const metadata: Metadata = {
  title: "Marketplace settings — Admin",
  robots: { index: false, follow: false },
};

const settings = [
  {
    icon: Globe2,
    title: "Marketplace identity",
    text: "Brand name, public support contacts, locale, and supported currency.",
  },
  {
    icon: MapPin,
    title: "Locations & coverage",
    text: "Pakistan cities, service coverage, and marketplace location defaults.",
  },
  {
    icon: SlidersHorizontal,
    title: "Listing policies",
    text: "Category attributes, listing review rules, expiry, and content policies.",
  },
  {
    icon: BellRing,
    title: "Notifications",
    text: "Email, SMS, and in-product notification templates and delivery monitoring.",
  },
  {
    icon: Mail,
    title: "Email delivery",
    text: "Verified sending domain, sender identity, bounce handling, and delivery status.",
  },
  {
    icon: ShieldCheck,
    title: "Security & integrations",
    text: "Admin controls and provider configuration status; no secret values stored here.",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-semibold tracking-[0.16em] text-emerald-400 uppercase">
          Governance
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Marketplace settings</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Centralize marketplace policy and service configuration. These controls are a design
          inventory until they are backed by audited APIs.
        </p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {settings.map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-xl border border-white/10 bg-[#1F1F1F] p-5">
            <Icon className="size-4 text-emerald-400" />
            <h2 className="mt-3 text-sm font-semibold text-slate-100">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
            {title === "Security & integrations" && (
              <div className="mt-4 flex gap-4">
                <Link
                  href="/admin/security"
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                >
                  Security center
                </Link>
                <Link
                  href="/admin/finance/integrations"
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                >
                  Payment setup
                </Link>
              </div>
            )}
          </article>
        ))}
      </section>
      <p className="text-xs leading-5 text-slate-500">
        Before production, make configuration changes permission-gated, schema-validated, audited
        with before/after values, and protected against concurrent edits. Never place provider
        secrets or customer payment credentials in general settings.
      </p>
    </div>
  );
}
