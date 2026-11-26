import type { Metadata } from "next";
import { BellRing } from "lucide-react";

import { AdminModulePage } from "@/features/admin/components/admin-module-page";

export const metadata: Metadata = {
  title: "Notifications & email — Admin",
  robots: { index: false, follow: false },
};

export default function AdminCommunicationsPage() {
  return (
    <AdminModulePage
      eyebrow="Platform"
      title="Notifications & email"
      description="Coordinate marketplace system messages and transactional communications while protecting customer consent and delivery reputation."
      icon={BellRing}
      metrics={[
        { label: "Templates", value: "—", detail: "No template registry connected" },
        { label: "Pending delivery", value: "—", detail: "Connect delivery provider" },
        { label: "Bounces / failures", value: "—", detail: "No provider events connected" },
        { label: "Consent exceptions", value: "—", detail: "Consent reporting not configured" },
      ]}
      workflows={[
        {
          title: "Transactional templates",
          description:
            "Version and review verification, listing, inspection, and payment messages.",
        },
        {
          title: "Delivery monitoring",
          description: "Track provider delivery, bounce, retry, and suppression events.",
        },
        {
          title: "Consent and localization",
          description:
            "Separate essential service messages from marketing preferences and support localized templates.",
        },
      ]}
      connectedTo={[
        "Transactional email provider",
        "SMS provider and consent records",
        "Template versioning and delivery event webhooks",
      ]}
      relatedHref="/admin/marketing"
      relatedLabel="Open marketing workspace"
    />
  );
}
