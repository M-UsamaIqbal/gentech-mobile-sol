import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  BadgeDollarSign,
  Banknote,
  BookOpenCheck,
  Boxes,
  Building2,
  Calculator,
  ChartNoAxesCombined,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  FileText,
  Import,
  Landmark,
  PackageCheck,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { getPaymentProvider } from "@/features/inspections/payments";

const SECTIONS = [
  { slug: "ledger", label: "General ledger", icon: BookOpenCheck },
  { slug: "accounts", label: "Chart of accounts", icon: Calculator },
  { slug: "sales", label: "Sales & invoices", icon: Receipt },
  { slug: "receivables", label: "Accounts receivable", icon: Receipt },
  { slug: "purchases", label: "Purchases & LPOs", icon: ClipboardCheck },
  { slug: "payables", label: "Accounts payable", icon: FileCheck2 },
  { slug: "expenses", label: "Expenses", icon: Banknote },
  { slug: "budgets", label: "Budgets & cost centers", icon: ChartNoAxesCombined },
  { slug: "payroll", label: "Payroll register", icon: Wallet },
  { slug: "inventory", label: "Stock & IMEI", icon: Boxes },
  { slug: "imports", label: "Imports & exports", icon: Import },
  { slug: "duties", label: "Customs & duties", icon: Building2 },
  { slug: "tax", label: "Tax & withholding", icon: Calculator },
  { slug: "cash", label: "Cash & petty cash", icon: Banknote },
  { slug: "banking", label: "Banks & transfers", icon: Landmark },
  { slug: "cheques", label: "Cheques", icon: FileCheck2 },
  { slug: "journals", label: "Journal entries", icon: FileText },
  { slug: "investments", label: "Investments", icon: ChartNoAxesCombined },
  { slug: "fixed-assets", label: "Fixed assets", icon: Building2 },
  { slug: "returns", label: "Returns & refunds", icon: RotateCcw },
  { slug: "reconciliation", label: "Reconciliation", icon: ArrowLeftRight },
  { slug: "integrations", label: "Payment methods", icon: Wallet },
  { slug: "reports", label: "Finance reports", icon: ChartNoAxesCombined },
] as const;

const CONTENT: Record<
  string,
  {
    title: string;
    description: string;
    note: string;
    columns: string[];
    workflows: string[];
  }
> = {
  ledger: {
    title: "General ledger",
    description:
      "Review balanced, traceable accounting entries across marketplace and company operations.",
    note: "A listing's asking price is not marketplace revenue. Record only realized platform fees, commissions, and company transactions.",
    columns: ["Entry", "Posting date", "Account", "Debit (PKR)", "Credit (PKR)", "Status"],
    workflows: [
      "Double-entry posting and period locking",
      "Trace entries to source transactions",
      "Review adjustments and reversal history",
    ],
  },
  accounts: {
    title: "Chart of accounts",
    description:
      "Define the account structure for marketplace fees, provider clearing, operating costs, and company-owned stock.",
    note: "Keep customer funds, payment-provider clearing, company cash, and revenue accounts distinct.",
    columns: ["Account code", "Account name", "Type", "Parent account", "Balance", "Status"],
    workflows: [
      "Assets, liabilities, equity, income, and expenses",
      "Provider and bank clearing accounts",
      "Separate marketplace activity from company-owned inventory",
    ],
  },
  sales: {
    title: "Sales & invoices",
    description:
      "Manage company invoices and marketplace service-fee billing without treating peer-to-peer listing value as revenue.",
    note: "Distinguish marketplace listing activity from a company sale. Generate tax invoices only from verified source records.",
    columns: ["Invoice", "Customer / dealer", "Issue date", "Due date", "Amount (PKR)", "Status"],
    workflows: [
      "Service fees, subscriptions, inspections, and promotion invoices",
      "Invoice numbering, tax fields, and credit notes",
      "Receivables aging and collection follow-up",
    ],
  },
  receivables: {
    title: "Accounts receivable",
    description:
      "Track verified amounts owed to the company for platform services, dealer subscriptions, inspections, and promotions.",
    note: "Do not recognize a seller's phone sale as a company receivable unless the company is contractually the seller.",
    columns: ["Customer / dealer", "Invoice", "Invoice date", "Due date", "Open (PKR)", "Aging"],
    workflows: [
      "Invoice-to-payment matching with partial payment support",
      "Aging buckets, collection notes, and dispute holds",
      "Credit notes and write-offs require separate approval",
    ],
  },
  purchases: {
    title: "Purchases & LPOs",
    description:
      "Control supplier requests, local purchase orders, goods receipts, and approved company expenses.",
    note: "A purchase order is a commitment, not a payment. Match approved PO, goods received, and supplier invoice before posting.",
    columns: [
      "LPO / PO",
      "Supplier",
      "Request date",
      "Expected delivery",
      "Amount (PKR)",
      "Approval",
    ],
    workflows: [
      "Purchase requisition and budget owner approval",
      "Local purchase orders (LPO) and supplier terms",
      "Three-way match: PO, receipt, and invoice",
    ],
  },
  payables: {
    title: "Accounts payable",
    description:
      "Review supplier invoices, due dates, purchase-order matches, and approved company payment runs.",
    note: "Do not mark an invoice paid based on an uploaded screenshot alone. Match bank/provider evidence and retain the approver trail.",
    columns: ["Supplier", "Invoice", "Received", "Due date", "Open (PKR)", "Approval"],
    workflows: [
      "Match supplier invoice to approved PO and goods receipt",
      "Duplicate invoice/reference detection and due-date tracking",
      "Payment run approvals separated from payment execution",
    ],
  },
  expenses: {
    title: "Expense claims",
    description:
      "Record business expenses with category, cost center, supporting documents, and approval ownership.",
    note: "Expense claims need a documented policy, budget checks, receipt retention, and reviewer separation from the claimant.",
    columns: ["Claim", "Employee / vendor", "Category", "Submitted", "Amount (PKR)", "Review"],
    workflows: [
      "Receipt attachment, category, and business purpose",
      "Policy limits, cost-center assignment, and exception handling",
      "Approved claim posted to the ledger with a source reference",
    ],
  },
  budgets: {
    title: "Budgets & cost centers",
    description:
      "Plan approved operating budgets and compare actual posted spend by business unit and period.",
    note: "Budget controls do not replace purchase approval or cash-flow review. Do not treat forecasts as posted financial results.",
    columns: ["Cost center", "Period", "Budget (PKR)", "Committed (PKR)", "Actual (PKR)", "Owner"],
    workflows: [
      "Versioned budgets, forecast assumptions, and owner sign-off",
      "Committed PO amounts vs posted actual expense",
      "Threshold alerts and documented budget reallocation",
    ],
  },
  payroll: {
    title: "Payroll register",
    description:
      "Plan a restricted payroll workflow for authorized HR and finance staff with masked employee information.",
    note: "Payroll includes sensitive personal and compensation data. This register is not connected; implement strict field-level authorization, secure exports, and applicable local review.",
    columns: [
      "Pay period",
      "Employee (restricted)",
      "Department",
      "Gross (PKR)",
      "Net (PKR)",
      "Approval",
    ],
    workflows: [
      "Restricted employee master and approved changes",
      "Payroll preparation, independent review, and payment reconciliation",
      "Confidential payslip delivery and retention schedule",
    ],
  },
  inventory: {
    title: "Stock & IMEI",
    description:
      "Track only business-owned devices and materials; customer listings remain marketplace listings, not company stock.",
    note: "Restrict IMEI visibility to authorized staff. Mask identifiers in lists, log access, and never expose device identifiers in exports by default.",
    columns: ["SKU / masked IMEI", "Device / item", "Location", "Quantity", "Cost (PKR)", "Status"],
    workflows: [
      "Serialized phone stock, IMEI, condition, and ownership",
      "Goods received, transfers, counts, and adjustments",
      "Cost valuation and stock movement audit",
    ],
  },
  imports: {
    title: "Imports & exports",
    description:
      "Prepare supplier shipments and customs document workflows for company-owned inventory and business materials.",
    note: "Import/export documents and customs entries need review by your licensed customs and tax advisers before filing.",
    columns: [
      "Shipment",
      "Supplier / broker",
      "Origin / destination",
      "Arrival / dispatch",
      "Declared value",
      "Status",
    ],
    workflows: [
      "Commercial invoice, packing list, and shipment tracking",
      "Import declaration and clearance document checklist",
      "Export documentation and proof-of-dispatch archive",
    ],
  },
  duties: {
    title: "Customs & duties",
    description:
      "Capture verified import costs, applicable duties, and landed cost for eligible company-owned goods.",
    note: "Do not estimate or automatically apply PTA/FBR charges. Duty treatment depends on current rules, classification, and shipment facts.",
    columns: ["Declaration", "Shipment", "HS code", "Customs value", "Duty / tax (PKR)", "Review"],
    workflows: [
      "Store assessed duties against source declarations",
      "Allocate verified freight and clearance to landed cost",
      "Reconcile assessments with broker and payment evidence",
    ],
  },
  tax: {
    title: "Tax & withholding",
    description:
      "Organize reviewed tax configuration, source documents, tax invoices, and filing-period reconciliations.",
    note: "Pakistan tax, withholding, and customs rules depend on the business and transaction. Obtain current advice from a qualified Pakistan tax professional; do not calculate or file from this placeholder.",
    columns: ["Tax period", "Tax type", "Source records", "Taxable base", "Amount (PKR)", "Review"],
    workflows: [
      "Versioned tax codes and effective dates approved by an adviser",
      "Withholding certificates and documented counterparty records",
      "Period reconciliation and reviewed filing export",
    ],
  },
  cash: {
    title: "Cash & petty cash",
    description:
      "Control company cash floats, receipts, expense claims, and cash-count differences.",
    note: "Require a named custodian, supporting evidence, approval limits, and independent cash counts. Customer funds are not petty cash.",
    columns: ["Voucher", "Custodian / payee", "Date", "Purpose", "Amount (PKR)", "Approval"],
    workflows: [
      "Float creation, replenishment, and close-out",
      "Receipts, expense categories, and approval limits",
      "Surprise counts and variance investigation",
    ],
  },
  banking: {
    title: "Banks & transfers",
    description:
      "Register company settlement accounts and reconcile verified bank statement lines against recorded transactions.",
    note: "Never store online banking passwords, OTPs, full card data, or secret keys in this console.",
    columns: [
      "Reference",
      "Bank / account (masked)",
      "Value date",
      "Description",
      "Amount (PKR)",
      "Match",
    ],
    workflows: [
      "Masked company bank-account register",
      "Statement import and transaction matching",
      "Controlled manual bank-transfer verification",
    ],
  },
  cheques: {
    title: "Cheque register",
    description:
      "Track issued and received company cheques, deposits, clearance, and returned-cheque follow-up.",
    note: "Cheque numbers and bank details are sensitive financial data; limit visibility and mask them in list views.",
    columns: [
      "Cheque (masked)",
      "Bank / counterparty",
      "Issue / deposit date",
      "Amount (PKR)",
      "Direction",
      "Status",
    ],
    workflows: [
      "Issued and received cheque register",
      "Deposit, clearing, bounce, and cancellation states",
      "Evidence attachment and dual approval for changes",
    ],
  },
  journals: {
    title: "Journal entries",
    description:
      "Draft, review, approve, and post adjusting entries with a balanced debit and credit trail.",
    note: "Posted journals should be immutable. Correct errors with linked reversing entries rather than editing posted history.",
    columns: ["Journal", "Effective date", "Period", "Prepared by", "Debit = credit", "Approval"],
    workflows: [
      "Draft journal with equal debit and credit totals",
      "Separate preparer and approver",
      "Period lock, posting, and linked reversals",
    ],
  },
  investments: {
    title: "Investments & fixed assets",
    description:
      "Register approved company investments and fixed assets with ownership, source documents, and review dates.",
    note: "This register is not investment advice or an investment execution platform. Record only approved company transactions.",
    columns: [
      "Asset / investment",
      "Type",
      "Acquisition date",
      "Cost (PKR)",
      "Review / maturity",
      "Status",
    ],
    workflows: [
      "Asset register and document custody",
      "Investment approval and counterparty due diligence",
      "Depreciation or valuation review by finance",
    ],
  },
  "fixed-assets": {
    title: "Fixed assets",
    description:
      "Maintain a register for company-owned equipment and other capitalized assets, distinct from phone listings and inventory.",
    note: "Capitalization thresholds, useful lives, depreciation, impairment, and disposals require an approved accounting policy.",
    columns: [
      "Asset tag",
      "Description",
      "Location / custodian",
      "Acquired",
      "Book value (PKR)",
      "Status",
    ],
    workflows: [
      "Asset acquisition, assignment, and supporting invoice",
      "Depreciation schedule and periodic physical verification",
      "Transfer, impairment, and disposal with approved journal references",
    ],
  },
  returns: {
    title: "Returns & refunds",
    description:
      "Route buyer disputes, service cancellations, payment refunds, and supplier returns with reason codes and evidence.",
    note: "Refund only against a verified original transaction. Use provider APIs and idempotency keys; never collect card details manually.",
    columns: [
      "Case / reference",
      "Original transaction",
      "Requester",
      "Reason",
      "Amount (PKR)",
      "Review",
    ],
    workflows: [
      "Buyer/seller issue triage and dispute evidence",
      "Approval limits and refund status tracking",
      "Supplier return authorization and credit-note matching",
    ],
  },
  reconciliation: {
    title: "Reconciliation",
    description:
      "Match provider settlements, manual-transfer evidence, bank statements, and ledger postings.",
    note: "A screenshot or customer-submitted receipt is not proof of settlement. Verify provider or bank records before marking paid.",
    columns: [
      "Batch / statement",
      "Source",
      "Period",
      "Expected (PKR)",
      "Matched (PKR)",
      "Variance",
    ],
    workflows: [
      "Provider payout vs. transaction ledger",
      "Bank statement vs. cashbook",
      "Exception queue, evidence, and reviewer sign-off",
    ],
  },
  reports: {
    title: "Finance reports",
    description: "Prepare management reporting from posted, reconciled, and approved records.",
    note: "Reports remain unavailable until the ledger, tax configuration, periods, and source integrations are reviewed.",
    columns: ["Report", "Period", "Basis", "Prepared by", "Generated at", "Review"],
    workflows: [
      "Profit & loss and balance sheet",
      "Cash flow, receivables, and payables aging",
      "Marketplace fees, refunds, and provider settlement report",
    ],
  },
};

export function AdminFinanceWorkspace({ section }: { section: string }) {
  if (section === "integrations") {
    return <PaymentIntegrations activeProvider={getPaymentProvider()?.id ?? "unavailable"} />;
  }
  const content = CONTENT[section];
  if (!content) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/finance"
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
          >
            Finance center
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{content.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{content.description}</p>
        </div>
        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-300">
          Integration required
        </span>
      </header>

      <FinanceNav active={section} />

      <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs leading-5 text-amber-100/80">
        <strong className="font-semibold text-amber-200">Finance control: </strong>
        {content.note}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Period total", "Not connected", "Connect approved ledger source"],
          ["Pending review", "Not connected", "No records loaded"],
          ["Needs reconciliation", "Not connected", "Connect bank/provider feed"],
          ["Last close", "Not configured", "Set an accounting period"],
        ].map(([label, value, detail]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-[#1F1F1F] p-4">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-3 text-lg font-semibold text-slate-200">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-white/10 bg-[#1F1F1F]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{content.title} register</h2>
            <p className="mt-1 text-xs text-slate-500">
              No live records shown until a verified data source is connected.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled
              title="Connect the finance API to enable exports"
              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-500 disabled:cursor-not-allowed"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowDownToLine className="size-3.5" /> Export
              </span>
            </button>
            <button
              type="button"
              disabled
              title="Connect the finance API to create records"
              className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950 opacity-50 disabled:cursor-not-allowed"
            >
              + New{" "}
              {section === "purchases" ? "LPO" : section === "journals" ? "journal" : "record"}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="border-b border-white/[0.07] text-slate-500">
              <tr>
                {content.columns.map((column) => (
                  <th key={column} className="px-4 py-3 font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={content.columns.length} className="px-4 py-12 text-center">
                  <PackageCheck className="mx-auto size-6 text-slate-600" />
                  <p className="mt-3 text-sm font-medium text-slate-300">No records connected</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Build and connect the API before creating or importing financial records.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {content.workflows.map((workflow, index) => (
          <div key={workflow} className="rounded-xl border border-white/10 bg-[#1F1F1F] p-4">
            <p className="text-xs font-semibold tracking-widest text-emerald-400 uppercase">
              Control {index + 1}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-300">{workflow}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function FinanceNav({ active }: { active: string }) {
  return (
    <nav aria-label="Finance modules" className="flex gap-2 overflow-x-auto pb-1">
      {SECTIONS.map(({ slug, label, icon: Icon }) => (
        <Link
          key={slug}
          href={`/admin/finance/${slug}`}
          aria-current={active === slug ? "page" : undefined}
          className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            active === slug
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              : "border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          <Icon className="size-3.5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function PaymentIntegrations({ activeProvider }: { activeProvider: string }) {
  const providers = [
    {
      name: "PayFast Pakistan",
      type: "Direct API · sandbox, 3-D Secure, and compliance verification required",
      icon: CreditCard,
      status:
        activeProvider === "payfast"
          ? "Configured · live mode gated"
          : activeProvider === "sandbox"
            ? "Sandbox active · no real charges"
            : "Unavailable · fail closed",
    },
    {
      name: "JazzCash",
      type: "Mobile wallet / gateway",
      icon: BadgeDollarSign,
      status: "Not configured",
    },
    {
      name: "Easypaisa",
      type: "Mobile wallet / gateway",
      icon: BadgeDollarSign,
      status: "Not configured",
    },
    {
      name: "NayaPay",
      type: "Wallet / payment partner",
      icon: BadgeDollarSign,
      status: "Not configured",
    },
    {
      name: "Visa",
      type: "Card network · via acquiring bank/gateway",
      icon: CreditCard,
      status: "Not configured",
    },
    {
      name: "Mastercard",
      type: "Card network · via acquiring bank/gateway",
      icon: CreditCard,
      status: "Not configured",
    },
    {
      name: "Manual bank transfer",
      type: "Company account · staff verification",
      icon: Landmark,
      status: "Not configured",
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/finance"
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
          >
            Finance center
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Payment integrations
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Prepare payment-provider setup for Pakistan. Visa and Mastercard are card networks;
            enable them through a supported acquiring bank or gateway, not as direct wallets.
          </p>
        </div>
        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-300">
          {activeProvider === "sandbox"
            ? "Sandbox active · no real charges"
            : activeProvider === "payfast"
              ? "PayFast configured · live mode gated"
              : "Payments unavailable · fail closed"}
        </span>
      </header>
      <FinanceNav active="integrations" />

      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4">
        <p className="text-sm font-semibold text-emerald-200">Credential-safe integration rule</p>
        <p className="mt-1 text-xs leading-5 text-slate-300">
          Provider secrets belong in server-side secret storage, never in this page, source control,
          browser storage, or a public environment variable. Inspection payment details are sent
          directly to PayFast over HTTPS and are not persisted by GenTech. Live processing remains
          gated on merchant sandbox and compliance review.
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {providers.map(({ name, type, icon: Icon, status }) => (
          <article key={name} className="rounded-xl border border-white/10 bg-[#1F1F1F] p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-white/[0.06] text-emerald-400">
                <Icon className="size-5" />
              </span>
              <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-400">
                {status}
              </span>
            </div>
            <h2 className="mt-4 text-sm font-semibold text-slate-100">{name}</h2>
            <p className="mt-1 min-h-8 text-xs leading-4 text-slate-500">{type}</p>
            {name === "PayFast Pakistan" && (
              <p className="mt-2 text-xs leading-4 text-amber-300">
                {activeProvider === "payfast"
                  ? "Inspection payments use the direct API. Keep live mode disabled until merchant sandbox, OTP/3-D Secure, and compliance review are complete. Promotion checkout is not enabled."
                  : "No live payment is accepted. Promotion checkout remains disabled until verified provider processing is connected."}
              </p>
            )}
            <button
              type="button"
              disabled
              title="Provider credentials and verified server API are required"
              className="mt-4 w-full cursor-not-allowed rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-500"
            >
              Configure after secure API setup
            </button>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#1F1F1F] p-5">
          <h2 className="text-sm font-semibold text-slate-100">Required server-side controls</h2>
          <ul className="mt-4 space-y-3 text-xs leading-5 text-slate-400">
            {[
              "Create payment intents on the server; verify amount, currency, ownership, and order state.",
              "Verify provider callbacks and status responses against documented references; enforce idempotency.",
              "Keep an append-only transaction/event ledger; never treat a browser redirect as proof of payment.",
              "Separate sandbox and production credentials; rotate secrets and restrict staff access.",
              "Require dual approval for manual-transfer verification, refunds, and payout account changes.",
              "Reconcile provider settlement reports to the bank and ledger; alert on mismatches.",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1F1F1F] p-5">
          <h2 className="text-sm font-semibold text-slate-100">Manual bank transfer review</h2>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            For bank transfer, match the incoming bank statement—not a customer-uploaded receipt
            alone—to an outstanding order before confirming payment.
          </p>
          <div className="mt-4 space-y-2">
            {[
              "Unique reference per payment",
              "Restricted and masked proof documents",
              "Independent reviewer approval",
              "Duplicate-reference detection",
              "Document retention and audit trail",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-slate-300"
              >
                <ShieldCheck className="size-3.5 text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export const FINANCE_SECTIONS = SECTIONS;
