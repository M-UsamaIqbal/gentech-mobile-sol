import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Cable, CreditCard, Mail, MapPinned, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "System integrations — Admin",
  robots: { index: false, follow: false },
};

const integrations = [
  {
    title: "Payment gateway",
    detail:
      "PayFast direct API is implemented for inspection payments; live mode is gated on sandbox and compliance review. Promotion checkout remains disabled.",
    icon: CreditCard,
    href: "/admin/finance/integrations",
    state: "Review required",
  },
  {
    title: "Email delivery",
    detail: "Provider credentials and verified sending domain are configured outside this UI.",
    icon: Mail,
    href: "/admin/communications",
    state: "Check environment",
  },
  {
    title: "Maps & location",
    detail: "Location API usage, key restrictions, quotas, and domain allow-list.",
    icon: MapPinned,
    href: "/admin/settings",
    state: "Check configuration",
  },
  {
    title: "Webhooks",
    detail: "Signed callbacks, retry queue, idempotency, and event delivery monitoring.",
    icon: Cable,
    href: "/admin/security",
    state: "Not connected",
  },
  {
    title: "Monitoring",
    detail: "Service health, queue depth, provider error rate, and incident alerting.",
    icon: Activity,
    href: "/admin/security",
    state: "Not connected",
  },
  {
    title: "Credential handling",
    detail: "Managed server-side secrets, restricted operators, and rotation history.",
    icon: ShieldCheck,
    href: "/admin/security",
    state: "Never display secrets here",
  },
];

export default function AdminIntegrationsPage() {
  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-semibold tracking-[0.16em] text-emerald-400 uppercase">
          Platform
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">System integrations</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Inventory third-party dependencies and implementation status. Credentials, connection
          strings, and signing secrets are never displayed or configured in this browser UI.
        </p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {integrations.map(({ title, detail, icon: Icon, href, state }) => (
          <Link
            key={title}
            href={href}
            className="rounded-xl border border-white/10 bg-[#1F1F1F] p-5 transition-colors hover:border-emerald-400/30"
          >
            <div className="flex items-start justify-between gap-3">
              <Icon className="size-4 text-emerald-400" />
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-xs text-amber-300">
                {state}
              </span>
            </div>
            <h2 className="mt-4 text-sm font-semibold text-slate-100">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p>
          </Link>
        ))}
      </section>
      <p className="text-xs leading-5 text-slate-500">
        Verify each provider using its official current documentation. Use sandbox credentials
        first, restrict production secrets to server-side runtime, and test provider callbacks,
        status polling, and duplicate-submission handling before launch.
      </p>
    </div>
  );
}
