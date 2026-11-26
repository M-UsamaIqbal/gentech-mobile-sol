import type { Metadata } from "next";
import { AlertTriangle, KeyRound, LockKeyhole, ShieldCheck, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Staff access — Admin",
  robots: { index: false, follow: false },
};

const roles = [
  {
    name: "USER",
    current: true,
    description: "Marketplace buyer and seller. No internal administrative access.",
  },
  {
    name: "INSPECTOR",
    current: true,
    description:
      "Inspection workflows only; must not receive finance or access-management privileges.",
  },
  {
    name: "ADMIN",
    current: true,
    description: "Current application-wide administrator role; highly privileged.",
  },
  {
    name: "Finance approver",
    current: false,
    description:
      "Recommended future least-privilege permission set; not implemented in the current role model.",
  },
  {
    name: "Support agent",
    current: false,
    description: "Recommended future role limited to assigned customer support cases.",
  },
  {
    name: "Content manager",
    current: false,
    description: "Recommended future role limited to editorial and catalog publishing.",
  },
];

export default function AdminAccessPage() {
  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-400 uppercase">
            Governance
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Staff access</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Review the current role boundary and plan staff provisioning before opening internal
            tools to a wider team.
          </p>
        </div>
        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-300">
          Granular RBAC not implemented
        </span>
      </header>

      <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-300" />
          <div>
            <p className="text-sm font-semibold text-red-200">
              Current administrators are not permission-scoped
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-300">
              The current application authorizes the single ADMIN role across the entire admin area.
              The roles below are a planning guide only—this page does not grant, invite, or change
              access. Do not treat a UI role label as an authorization control.
            </p>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-white/10 bg-[#1F1F1F]">
        <div className="border-b border-white/[0.07] p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
              <Users className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Role model</h2>
              <p className="mt-1 text-xs text-slate-500">
                Existing roles are enforced by the application; suggested roles require backend
                implementation.
              </p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-white/[0.07]">
          {roles.map((role) => (
            <div
              key={role.name}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-slate-100">{role.name}</p>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
                  {role.description}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${role.current ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-700/50 text-slate-400"}`}
              >
                {role.current ? "Current role" : "Future role · not active"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            icon: LockKeyhole,
            title: "Least privilege",
            text: "Grant only the minimum permission set needed for a person’s job.",
          },
          {
            icon: KeyRound,
            title: "Strong sign-in",
            text: "Require MFA, short sessions, secure recovery, and prompt offboarding.",
          },
          {
            icon: ShieldCheck,
            title: "Sensitive approvals",
            text: "Separate requester, approver, and executor for refunds and payouts.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-xl border border-white/10 bg-[#1F1F1F] p-5">
            <Icon className="size-4 text-emerald-400" />
            <h2 className="mt-3 text-sm font-semibold text-slate-100">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
          </article>
        ))}
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Before inviting staff: implement server-side permissions on every page, API route, and
        server action; add MFA and session revocation; enforce self-demotion/last-admin protections;
        and test every role against unauthorized requests.
      </p>
    </div>
  );
}
