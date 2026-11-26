"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bookmark, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ROUTES } from "@/lib/constants";
import { useLocalizedHref } from "@/lib/localized-routing";
import { Button } from "@/components/ui/button";
import { trackSaveSearch } from "@/features/analytics/lib/events";
import { saveSearchAction } from "@/features/saved-searches/actions/saved-search.actions";

export function SaveSearchButton({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter();
  const signInHref = useLocalizedHref(ROUTES.signIn);
  const t = useTranslations("savedSearch");
  const [pending, setPending] = React.useState(false);

  async function save() {
    if (!isAuthenticated) {
      router.push(signInHref);
      return;
    }
    setPending(true);
    const query = window.location.search.replace(/^\?/, "");
    const result = await saveSearchAction({ query });
    setPending(false);

    if (!result.ok) {
      toast.error(result.error ?? t("error"));
      return;
    }
    trackSaveSearch(query);
    toast.success(t("saved"), { description: t("description") });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={save}
      disabled={pending}
      title={t("title")}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Bookmark className="size-4" />}
      <span className="hidden sm:inline">{t("button")}</span>
    </Button>
  );
}
