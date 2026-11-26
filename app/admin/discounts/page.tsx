import type { Metadata } from "next";
import { BadgePercent } from "lucide-react";

import { AdminModulePage } from "@/features/admin/components/admin-module-page";

export const metadata: Metadata = {
  title: "Discounts & vouchers — Admin",
  robots: { index: false, follow: false },
};

export default function AdminDiscountsPage() {
  return (
    <AdminModulePage
      eyebrow="Marketplace growth"
      title="Discounts & vouchers"
      description="Prepare controlled voucher and discount campaigns for platform services, dealer plans, inspections, and promotions."
      icon={BadgePercent}
      metrics={[
        { label: "Active voucher campaigns", value: "—", detail: "No voucher service connected" },
        { label: "Redemptions", value: "—", detail: "No redemption ledger" },
        { label: "Discount liability", value: "—", detail: "Needs finance configuration" },
        { label: "Scheduled campaigns", value: "—", detail: "No campaign calendar connected" },
      ]}
      workflows={[
        {
          title: "Eligibility rules",
          description:
            "Scope codes to products, users, dealers, dates, usage caps, and minimum amounts.",
        },
        {
          title: "Abuse prevention",
          description:
            "Enforce server-side limits, single-use rules, user eligibility, and redemption idempotency.",
        },
        {
          title: "Approval and reconciliation",
          description:
            "Approve campaign cost, record redemptions, and reconcile discount funding to finance.",
        },
      ]}
      connectedTo={[
        "Pricing and checkout API",
        "Promotion / subscription catalogue",
        "Finance campaign approval and redemption ledger",
      ]}
      relatedHref="/admin/marketing"
      relatedLabel="Open marketing workspace"
    />
  );
}
