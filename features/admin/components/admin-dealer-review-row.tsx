"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Clock3, Loader2, MapPin, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DealerApplicationDto } from "@/features/dealer/types";
import {
  approveDealerApplicationAction,
  rejectDealerApplicationAction,
} from "@/features/dealer/actions/admin-dealer.actions";

export function AdminDealerReviewRow({ dealer }: { dealer: DealerApplicationDto }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");

  async function approve() {
    setPending(true);
    const result = await approveDealerApplicationAction({ dealerId: dealer.id });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${dealer.name} approved and verified.`);
    router.refresh();
  }

  async function reject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const result = await rejectDealerApplicationAction({ dealerId: dealer.id, reason });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Application rejected. The reason is saved to the dealer profile.");
    setRejecting(false);
    setReason("");
    router.refresh();
  }

  return (
    <article className="space-y-4 border-b border-white/[0.07] p-4 last:border-b-0 sm:p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-100">{dealer.name}</h2>
            <Badge
              variant="outline"
              className={
                dealer.status === "ACTIVE"
                  ? "border-emerald-300/25 text-emerald-200"
                  : dealer.status === "REJECTED"
                    ? "border-rose-300/25 text-rose-200"
                    : dealer.status === "SUSPENDED"
                      ? "border-slate-300/25 text-slate-300"
                      : "border-amber-300/25 text-amber-200"
              }
            >
              {dealer.status === "PENDING" ? (
                <Clock3 className="mr-1 size-3" aria-hidden="true" />
              ) : null}
              {dealer.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            {dealer.businessName || "Business name not provided"}
            {dealer.businessType ? ` · ${dealer.businessType}` : ""}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
            <span>{dealer.owner?.name ?? "Owner details unavailable"}</span>
            {dealer.owner?.email ? <span>{dealer.owner.email}</span> : null}
            {dealer.phone ? <span>{dealer.phone}</span> : null}
            {dealer.city ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" aria-hidden="true" />
                {dealer.city}
              </span>
            ) : null}
          </div>
          {dealer.address ? <p className="text-xs text-slate-500">{dealer.address}</p> : null}
          {dealer.taxNumber ? (
            <p className="text-xs text-slate-500">Tax number provided</p>
          ) : (
            <p className="text-xs text-amber-300/80">No tax number provided</p>
          )}
          {dealer.description ? (
            <p className="max-w-3xl text-sm leading-5 text-slate-300">{dealer.description}</p>
          ) : null}
          <p className="text-xs text-slate-500">
            Applied {new Date(dealer.createdAt).toLocaleDateString()}
          </p>
        </div>

        {dealer.status === "PENDING" ? (
          <div className="flex shrink-0 gap-2 sm:self-start">
            <Button
              size="sm"
              className="min-h-9 flex-1 bg-emerald-400 text-slate-950 hover:bg-emerald-300 sm:flex-none"
              onClick={approve}
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="size-4" aria-hidden="true" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="min-h-9 flex-1 border-rose-400/40 text-rose-200 hover:bg-rose-500/10 sm:flex-none"
              onClick={() => setRejecting((value) => !value)}
              disabled={pending}
            >
              <X className="size-4" aria-hidden="true" />
              Reject
            </Button>
          </div>
        ) : null}
      </div>

      {rejecting ? (
        <form onSubmit={reject} className="grid gap-2 sm:ml-auto sm:max-w-xl">
          <label
            htmlFor={`reject-reason-${dealer.id}`}
            className="text-xs font-medium text-slate-300"
          >
            Rejection reason (shown to the applicant)
          </label>
          <Textarea
            id={`reject-reason-${dealer.id}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            minLength={5}
            maxLength={500}
            required
            rows={3}
            placeholder="Explain what needs to be corrected before applying again."
            className="border-white/10 bg-[#181818] text-slate-100"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              disabled={pending || reason.trim().length < 5}
            >
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Confirm rejection
            </Button>
          </div>
        </form>
      ) : null}
      {dealer.status === "REJECTED" && dealer.reviewNote ? (
        <p className="rounded-lg border border-rose-400/15 bg-rose-400/[0.04] p-3 text-xs text-rose-100/80">
          Review note: {dealer.reviewNote}
        </p>
      ) : null}
    </article>
  );
}
