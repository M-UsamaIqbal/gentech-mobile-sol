"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Tag, Zap } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreatePromotionPlanInput, PromotionPlanDto } from "../types";
import {
  PROMOTION_PLACEMENTS,
  createPromotionPlanSchema,
  updatePromotionPlanSchema,
} from "../schemas/promotion";
import {
  createPromotionPlanAction,
  updatePromotionPlanAction,
} from "../actions/admin-promotion.actions";

const PLACEMENT_LABELS: Record<(typeof PROMOTION_PLACEMENTS)[number], string> = {
  FEATURED: "Featured",
  BOOSTED: "Boosted",
  TOP_SEARCH: "Top search",
  CATEGORY_FEATURED: "Category featured",
  HOMEPAGE_FEATURED: "Homepage featured",
};

const money = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

const EMPTY_FORM: CreatePromotionPlanInput = {
  name: "",
  description: "",
  placement: "FEATURED",
  price: 0,
  durationDays: 7,
  maxSlots: null,
  isActive: true,
};

export function AdminPromotionPlans({ plans }: { plans: PromotionPlanDto[] }) {
  const router = useRouter();
  const [form, setForm] = React.useState<CreatePromotionPlanInput>(EMPTY_FORM);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  function startEdit(plan: PromotionPlanDto) {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      description: plan.description ?? "",
      placement: plan.placement,
      price: plan.price,
      durationDays: plan.durationDays,
      maxSlots: plan.maxSlots,
      isActive: plan.isActive,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = createPromotionPlanSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the plan details.");
      return;
    }

    setPending(true);
    const result = editingId
      ? await updatePromotionPlanAction(
          updatePromotionPlanSchema.parse({ id: editingId, ...parsed.data }),
        )
      : await createPromotionPlanAction(parsed.data);
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(editingId ? "Promotion plan updated." : "Promotion plan created.");
    resetForm();
    router.refresh();
  }

  async function toggleActive(plan: PromotionPlanDto) {
    setPending(true);
    const result = await updatePromotionPlanAction({
      id: plan.id,
      isActive: !plan.isActive,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(plan.isActive ? "Plan deactivated." : "Plan activated.");
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
      <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#1F1F1F]">
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] p-4 sm:p-5">
          <div>
            <h2 className="font-semibold text-slate-100">Promotion packages</h2>
            <p className="mt-1 text-xs text-slate-400">
              {plans.length} {plans.length === 1 ? "plan" : "plans"} · inactive plans remain on
              existing promotions
            </p>
          </div>
          <Badge variant="outline" className="border-emerald-300/20 text-emerald-200">
            PKR pricing
          </Badge>
        </div>

        {plans.length ? (
          <ul className="divide-y divide-white/[0.07]">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-slate-100">{plan.name}</h3>
                    <Badge
                      variant="outline"
                      className={
                        plan.isActive
                          ? "border-emerald-300/20 text-emerald-200"
                          : "border-slate-300/20 text-slate-400"
                      }
                    >
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {PLACEMENT_LABELS[plan.placement]}
                    </span>
                  </div>
                  {plan.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-400">{plan.description}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">{money.format(plan.price)}</span>
                    <span>{plan.durationDays} days</span>
                    <span>
                      {plan.maxSlots === null
                        ? "Unlimited slots"
                        : `${plan.maxSlots} concurrent slots`}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-9 border-white/10"
                    onClick={() => startEdit(plan)}
                    disabled={pending}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={plan.isActive ? "ghost" : "outline"}
                    className="min-h-9"
                    onClick={() => void toggleActive(plan)}
                    disabled={pending}
                  >
                    {pending ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : null}
                    {plan.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-14 text-center">
            <Tag className="mx-auto size-8 text-slate-600" aria-hidden="true" />
            <h3 className="mt-3 text-sm font-semibold text-slate-200">
              No promotion plans configured
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Create a package to make it available in the seller flow.
            </p>
          </div>
        )}
      </section>

      <section className="h-fit rounded-xl border border-white/[0.08] bg-[#1F1F1F] p-4 sm:p-5">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
            {editingId ? (
              <Pencil className="size-4" aria-hidden="true" />
            ) : (
              <Plus className="size-4" aria-hidden="true" />
            )}
          </span>
          <div>
            <h2 className="font-semibold text-slate-100">
              {editingId ? "Edit package" : "Create package"}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Configure the package displayed to sellers. Prices are stored as decimal PKR.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <FieldLabel htmlFor="plan-name">Package name</FieldLabel>
          <Input
            id="plan-name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            maxLength={100}
            placeholder="e.g. Featured 7 days"
            required
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <div className="grid gap-2">
              <FieldLabel htmlFor="plan-placement">Placement</FieldLabel>
              <select
                id="plan-placement"
                value={form.placement}
                onChange={(event) =>
                  setForm({
                    ...form,
                    placement: event.target.value as CreatePromotionPlanInput["placement"],
                  })
                }
                className="h-10 w-full rounded-md border border-white/10 bg-[#181818] px-3 text-sm text-slate-100"
              >
                {PROMOTION_PLACEMENTS.map((placement) => (
                  <option key={placement} value={placement}>
                    {PLACEMENT_LABELS[placement]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="plan-price">Price (PKR)</FieldLabel>
              <Input
                id="plan-price"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={form.price || ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    price: event.target.value === "" ? 0 : Number(event.target.value),
                  })
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <div className="grid gap-2">
              <FieldLabel htmlFor="plan-duration">Duration (days)</FieldLabel>
              <Input
                id="plan-duration"
                type="number"
                min={1}
                max={3650}
                step={1}
                value={form.durationDays}
                onChange={(event) => setForm({ ...form, durationDays: Number(event.target.value) })}
                required
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="plan-slots">Concurrent slots</FieldLabel>
              <Input
                id="plan-slots"
                type="number"
                min={1}
                step={1}
                value={form.maxSlots ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    maxSlots: event.target.value === "" ? null : Number(event.target.value),
                  })
                }
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="plan-description">Description</FieldLabel>
            <Textarea
              id="plan-description"
              rows={3}
              maxLength={500}
              value={form.description ?? ""}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Explain what sellers get with this package."
            />
          </div>

          <label className="flex min-h-10 items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.isActive ?? true}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              className="size-4 accent-emerald-400"
            />
            Available to sellers
          </label>

          <div className="flex gap-2 pt-1">
            {editingId ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-10 flex-1 border-white/10"
                onClick={resetForm}
                disabled={pending}
              >
                Cancel
              </Button>
            ) : null}
            <Button type="submit" className="min-h-10 flex-1" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {editingId ? "Save changes" : "Create package"}
            </Button>
          </div>
        </form>

        <p className="mt-4 flex items-start gap-2 border-t border-white/[0.07] pt-4 text-xs leading-5 text-slate-500">
          <Zap className="mt-0.5 size-3.5 shrink-0 text-amber-300" aria-hidden="true" />
          Deactivating hides a plan from new purchases without removing it from existing promotion
          records.
        </p>
      </section>
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="text-xs text-slate-300">
      {children}
    </Label>
  );
}
