import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  AdminFinanceWorkspace,
  FINANCE_SECTIONS,
} from "@/features/admin/components/admin-finance-workspace";

export const metadata: Metadata = {
  title: "Finance workspace — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminFinanceSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!FINANCE_SECTIONS.some((item) => item.slug === section)) notFound();

  return <AdminFinanceWorkspace section={section} />;
}
