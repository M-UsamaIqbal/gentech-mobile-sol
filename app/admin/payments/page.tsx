import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Payments — Admin",
  robots: { index: false, follow: false },
};

export default function AdminPaymentsPage() {
  redirect("/admin/finance/integrations");
}
