import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

import { AdminModulePage } from "@/features/admin/components/admin-module-page";

export const metadata: Metadata = {
  title: "Editorial — Admin",
  robots: { index: false, follow: false },
};

export default function AdminBlogsPage() {
  return (
    <AdminModulePage
      eyebrow="Content"
      title="Editorial & guides"
      description="Plan trustworthy mobile-phone buying guides, market updates, and evergreen content for the marketplace."
      icon={BookOpen}
      metrics={[
        { label: "Published articles", value: "—", detail: "No editorial source connected" },
        { label: "Drafts in review", value: "—", detail: "Connect a content workflow" },
        { label: "Scheduled posts", value: "—", detail: "No publishing calendar connected" },
        { label: "Organic visits", value: "—", detail: "Connect search analytics" },
      ]}
      workflows={[
        {
          title: "Editorial calendar",
          description: "Coordinate topics, owners, review dates, and planned publication.",
        },
        {
          title: "Content review",
          description: "Manage fact checks, product details, editorial approvals, and revisions.",
        },
        {
          title: "SEO and performance",
          description: "Maintain metadata and track organic discovery after publication.",
        },
      ]}
      connectedTo={[
        "Content management and publishing",
        "Editorial approval workflow",
        "Search performance reporting",
      ]}
      relatedHref="/admin/categories"
      relatedLabel="Manage marketplace catalog"
    />
  );
}
