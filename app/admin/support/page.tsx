import type { Metadata } from "next";
import { MessageSquareText } from "lucide-react";

import { AdminModulePage } from "@/features/admin/components/admin-module-page";

export const metadata: Metadata = {
  title: "Customer Support — Admin",
  robots: { index: false, follow: false },
};

export default function AdminSupportPage() {
  return (
    <AdminModulePage
      eyebrow="Customer experience"
      title="Customer support"
      description="Give support teams a clear view of buyer and seller questions, marketplace issues, and service quality."
      icon={MessageSquareText}
      metrics={[
        { label: "Open conversations", value: "—", detail: "Connect the support inbox" },
        { label: "Awaiting response", value: "—", detail: "No queue data connected" },
        { label: "Resolution time", value: "—", detail: "Connect support reporting" },
        { label: "Customer satisfaction", value: "—", detail: "Connect feedback collection" },
      ]}
      workflows={[
        {
          title: "Shared support inbox",
          description: "Triage customer messages and assign clear ownership to each conversation.",
        },
        {
          title: "Service-level targets",
          description: "Set first-response and resolution targets by priority and support team.",
        },
        {
          title: "Escalations and outcomes",
          description: "Escalate safety, payment, and listing issues with a documented resolution.",
        },
      ]}
      connectedTo={[
        "Marketplace conversations",
        "Support inbox or helpdesk",
        "Service-level and customer feedback reporting",
      ]}
      relatedHref="/admin/users"
      relatedLabel="View customer accounts"
    />
  );
}
