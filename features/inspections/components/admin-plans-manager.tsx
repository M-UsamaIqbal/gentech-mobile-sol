"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { formatPrice } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createPlanAction,
  setPlanActiveAction,
  updatePlanAction,
} from "@/features/inspections/actions/admin-plan.actions";
import type { InspectionPlanDto } from "@/features/inspections/types";

export function AdminPlansManager({ plans }: { plans: InspectionPlanDto[] }) {
  const [creating, setCreating] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {plans.length} package{plans.length === 1 ? "" : "s"}
        </p>
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          <Plus className="size-4" />
          New package
        </Button>
      </div>

      {creating ? (
        <PlanForm
          onDone={() => setCreating(false)}
          submitLabel="Create package"
        />
      ) : null}

      <div className="space-y-4">
        {plans.map((plan) => (
          <PlanRow key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}

function PlanRow({ plan }: { plan: InspectionPlanDto }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function toggleActive() {
    setPending(true);
    const result = await setPlanActiveAction({ id: plan.id, isActive: !plan.isActive });
    setPending(false);
    if (result.ok) router.refresh();
    else toast.error(result.error ?? "Could not update.");
  }

  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{plan.name}</h3>
            <Badge variant={plan.isActive ? "secondary" : "outline"}>
              {plan.isActive ? "Active" : "Hidden"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {formatPrice(plan.price, { currency: plan.currency })} · {plan.checkpoints}+ checkpoints
          </p>
          {plan.features.length > 0 ? (
            <p className="text-muted-foreground mt-1 text-xs">{plan.features.join(" · ")}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleActive} disabled={pending}>
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {plan.isActive ? "Hide" : "Show"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
            {editing ? "Close" : "Edit"}
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="mt-4 border-t pt-4">
          <PlanForm plan={plan} onDone={() => setEditing(false)} submitLabel="Save changes" />
        </div>
      ) : null}
    </div>
  );
}

function PlanForm({
  plan,
  onDone,
  submitLabel,
}: {
  plan?: InspectionPlanDto;
  onDone: () => void;
  submitLabel: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const features = String(form.get("features") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const payload = {
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? "") || undefined,
      price: Number(form.get("price") ?? 0),
      checkpoints: Number(form.get("checkpoints") ?? 0),
      features,
    };

    setPending(true);
    const result = plan
      ? await updatePlanAction({ id: plan.id, ...payload })
      : await createPlanAction(payload);
    setPending(false);

    if (result.ok) {
      toast.success(plan ? "Package updated." : "Package created.");
      onDone();
      router.refresh();
    } else {
      toast.error(result.error ?? "Could not save.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required defaultValue={plan?.name} maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Price (PKR)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step="1"
            required
            defaultValue={plan?.price}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="checkpoints">Checkpoints</Label>
          <Input
            id="checkpoints"
            name="checkpoints"
            type="number"
            min={0}
            step="1"
            defaultValue={plan?.checkpoints ?? 0}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          defaultValue={plan?.description ?? ""}
          maxLength={500}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="features">Features (one per line)</Label>
        <Textarea
          id="features"
          name="features"
          rows={4}
          defaultValue={plan?.features.join("\n")}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
