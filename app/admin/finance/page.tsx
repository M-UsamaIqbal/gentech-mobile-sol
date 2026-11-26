import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Banknote,
  BookOpenCheck,
  Boxes,
  Calculator,
  ChartNoAxesCombined,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  FileText,
  Import,
  Landmark,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Wallet,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Finance & ERP — Admin",
  robots: { index: false, follow: false },
};

const GROUPS = [
  {
    title: "Accounting & reporting",
    description: "Core books, controls, and company reporting.",
    items: [
      { slug: "ledger", label: "General ledger", icon: BookOpenCheck },
      { slug: "accounts", label: "Chart of accounts", icon: Calculator },
      { slug: "journals", label: "Journal entries", icon: FileText },
      { slug: "budgets", label: "Budgets & cost centers", icon: ChartNoAxesCombined },
      { slug: "tax", label: "Tax & withholding", icon: Calculator },
      { slug: "reports", label: "Finance reports", icon: ChartNoAxesCombined },
      { slug: "reconciliation", label: "Reconciliation", icon: ArrowLeftRight },
    ],
  },
  {
    title: "Marketplace money",
    description: "Payment collection, customer refunds, and platform transactions.",
    items: [
      { slug: "integrations", label: "Payment methods", icon: CreditCard },
      { slug: "sales", label: "Sales & invoices", icon: Receipt },
      { slug: "receivables", label: "Accounts receivable", icon: Receipt },
      { slug: "returns", label: "Returns & refunds", icon: RotateCcw },
      { slug: "banking", label: "Banks & transfers", icon: Landmark },
      { slug: "cash", label: "Cash & petty cash", icon: Banknote },
      { slug: "cheques", label: "Cheque register", icon: FileCheck2 },
      { slug: "expenses", label: "Expenses", icon: Banknote },
      { slug: "payables", label: "Accounts payable", icon: ClipboardCheck },
      { slug: "payroll", label: "Payroll register", icon: Wallet },
    ],
  },
  {
    title: "Procurement & stock",
    description:
      "For purchases and inventory owned by the company, not third-party marketplace listings.",
    items: [
      { slug: "purchases", label: "Purchases & local POs", icon: ClipboardCheck },
      { slug: "inventory", label: "Stock & masked IMEI", icon: Boxes },
      { slug: "imports", label: "Import & export", icon: Import },
      { slug: "duties", label: "Customs & duties", icon: ArrowDownToLine },
      { slug: "investments", label: "Investments & assets", icon: ArrowUpFromLine },
      { slug: "fixed-assets", label: "Fixed assets", icon: Boxes },
    ],
  },
];

export default function AdminFinancePage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-400 uppercase">
            Finance & ERP
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Finance center</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            A control-first finance workspace for marketplace transactions and company operations.
            API, accounting policies, provider accounts, and finance data are not connected yet.
          </p>
        </div>
        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-300">
          Setup required
        </span>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Marketplace collections", "Not connected", "Provider settlement data"],
          ["Company cash position", "Not connected", "Verified bank and cash accounts"],
          ["Open approvals", "Not connected", "Finance workflow API"],
          ["Current accounting period", "Not configured", "Finance policy and period close"],
        ].map(([label, value, detail]) => (
          <section key={label} className="rounded-xl border border-white/10 bg-[#1F1F1F] p-4">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-3 text-lg font-semibold text-slate-200">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
          </section>
        ))}
      </div>

      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4">
        <p className="text-sm font-semibold text-emerald-200">
          Important marketplace accounting boundary
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-300">
          GenTech is a listings marketplace: a seller&apos;s asking price is not GenTech revenue or
          inventory. Record actual platform fees and verified payment settlements separately. Use
          purchase, stock, import-duty, and asset modules only for goods and costs owned by the
          company.
        </p>
      </div>

      {GROUPS.map((group) => (
        <section key={group.title}>
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-100">{group.title}</h2>
            <p className="mt-1 text-xs text-slate-500">{group.description}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map(({ slug, label, icon: Icon }) => (
              <Link
                key={slug}
                href={`/admin/finance/${slug}`}
                className="group flex items-start gap-3 rounded-xl border border-white/10 bg-[#1F1F1F] p-4 transition-colors hover:border-emerald-400/30"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-emerald-400">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-100">{label}</span>
                  <span className="mt-1 block text-xs text-slate-500">Open workspace →</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-xl border border-white/10 bg-[#1F1F1F] p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-400" />
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Safe rollout sequence</h2>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Have a Pakistan-qualified accountant review your chart of accounts, tax and
              withholding treatment, inventory policy, and period-close controls. Then integrate
              provider sandboxes, reconcile test settlements, configure least-privilege approvals,
              and independently verify production credentials before processing real money.
            </p>
            <Link
              href="/admin/finance/integrations"
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              <Wallet className="size-3.5" /> Review payment integrations
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
