import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  Fingerprint,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Security center — Admin",
  robots: { index: false, follow: false },
};

const controls = [
  [
    "Admin route guard",
    "Existing",
    "Admin layout checks the signed-in user’s ADMIN role server-side.",
  ],
  [
    "Per-module permission checks",
    "Required",
    "Current authorization is coarse-grained; implement RBAC at every server boundary.",
  ],
  [
    "MFA and staff recovery",
    "Verify",
    "Configure an MFA policy and test recovery, session revocation, and offboarding.",
  ],
  [
    "Payment credentials",
    "Not connected",
    "Use server-side secret storage and separate sandbox from production credentials.",
  ],
  [
    "Payment event verification",
    "Required",
    "Verify provider signatures, idempotency, amount, order, and currency on the server.",
  ],
  [
    "Security monitoring",
    "Connect",
    "Alert on privilege changes, repeated failures, secrets access, and unusual payment/refund activity.",
  ],
];

export default function AdminSecurityPage() {
  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-semibold tracking-[0.16em] text-emerald-400 uppercase">
          Governance
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Security center</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          A launch-readiness checklist for admin access, payment processing, sensitive marketplace
          data, and incident response.
        </p>
      </header>

      <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
          <p className="text-xs leading-5 text-amber-100/80">
            <strong className="font-semibold text-amber-200">
              Readiness is not certification.
            </strong>{" "}
            This interface does not certify PCI DSS, bank compliance, legal compliance, or
            production security. Complete provider, legal, tax, and security reviews before
            processing real payments.
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-white/10 bg-[#1F1F1F]">
        <div className="border-b border-white/[0.07] p-5">
          <h2 className="text-sm font-semibold text-slate-100">Control readiness</h2>
          <p className="mt-1 text-xs text-slate-500">
            Status labels are implementation guidance, not automated test results.
          </p>
        </div>
        <div className="divide-y divide-white/[0.07]">
          {controls.map(([title, status, description]) => (
            <div key={title} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-slate-100">{title}</p>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">{description}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${status === "Existing" ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}
              >
                {status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: LockKeyhole,
            title: "Access",
            text: "Least privilege, MFA, short-lived sessions, verified offboarding.",
            href: "/admin/access",
          },
          {
            icon: Banknote,
            title: "Payments",
            text: "Direct PayFast API; details are transient and never persisted by GenTech.",
            href: "/admin/finance/integrations",
          },
          {
            icon: Fingerprint,
            title: "Customer data",
            text: "Mask IMEI and personal data; log access and limit exports.",
            href: "/admin/audit",
          },
          {
            icon: ShieldAlert,
            title: "Incidents",
            text: "Define escalation, evidence preservation, notification, and recovery.",
            href: "/admin/audit",
          },
        ].map(({ icon: Icon, title, text, href }) => (
          <Link
            key={title}
            href={href}
            className="rounded-xl border border-white/10 bg-[#1F1F1F] p-4 transition-colors hover:border-emerald-400/30"
          >
            <Icon className="size-4 text-emerald-400" />
            <h2 className="mt-3 text-sm font-semibold text-slate-100">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
          </Link>
        ))}
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#1F1F1F] p-4">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
        <p className="text-xs leading-5 text-slate-400">
          Never paste production credentials into tickets, chat, source code, browser forms, or this
          admin UI. Rotate any secret that was exposed. Prefer provider-hosted checkout where
          available; for approved direct APIs, minimize transient handling and never persist payment
          credentials. Validate callbacks and status responses against official provider
          documentation.
        </p>
      </div>
    </div>
  );
}
