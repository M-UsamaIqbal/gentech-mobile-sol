import type { Metadata } from "next";
import { Megaphone } from "lucide-react";

import { AdminModulePage } from "@/features/admin/components/admin-module-page";

export const metadata: Metadata = {
  title: "Marketing & Leads — Admin",
  robots: { index: false, follow: false },
};

export default function AdminMarketingPage() {
  return (
    <AdminModulePage
      eyebrow="Growth"
      title="Marketing & leads"
      description="Coordinate marketplace acquisition, dealer relationships, and campaign performance from one workspace."
      icon={Megaphone}
      metrics={[
        { label: "Active campaigns", value: "—", detail: "Connect a campaign source" },
        { label: "Dealer leads", value: "—", detail: "Dealer lead data not connected" },
        { label: "New inquiries", value: "—", detail: "Connect lead capture" },
        { label: "Attributed visits", value: "—", detail: "Connect analytics" },
      ]}
      workflows={[
        {
          title: "Campaign planning",
          description: "Organize channel, audience, budget, schedule, and campaign owner.",
        },
        {
          title: "Dealer lead pipeline",
          description: "Track inbound dealer interest, qualification, follow-up, and onboarding.",
        },
        {
          title: "Acquisition reporting",
          description: "Compare campaign sources against visits, sign-ups, and listing activity.",
        },
      ]}
      connectedTo={[
        "Campaign and ad platform",
        "Dealer lead capture and CRM",
        "Web analytics and attribution",
      ]}
      relatedHref="/admin/users"
      relatedLabel="View customer accounts"
    />
  );
}
