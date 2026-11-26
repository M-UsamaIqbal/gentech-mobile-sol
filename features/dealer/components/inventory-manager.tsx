"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Package, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addInventoryAction,
  removeDealerInventoryAction,
  updateDealerInventoryAction,
} from "../actions/dealer.actions";
import { addInventorySchema, updateInventorySchema } from "../schemas/dealer";
import type { DealerInventoryDto } from "../types";

const currency = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

export function InventoryManager({
  dealerId,
  inventory,
}: {
  dealerId: string;
  inventory: DealerInventoryDto[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<string[]>([]);

  async function addItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const rawCost = String(data.get("costPrice") ?? "");
    const parsed = addInventorySchema.safeParse({
      dealerId,
      sku: data.get("sku") || undefined,
      stockCount: Number(data.get("stockCount")),
      location: data.get("location") || undefined,
      costPrice: rawCost ? Number(rawCost) : undefined,
    });

    if (!parsed.success) {
      setErrors(parsed.error.issues.map((issue) => issue.message));
      return;
    }
    setErrors([]);
    setSubmitting(true);
    const result = await addInventoryAction(parsed.data);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    form.reset();
    toast.success("Inventory item added.");
    router.refresh();
  }

  async function saveItem(event: React.FormEvent<HTMLFormElement>, item: DealerInventoryDto) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = updateInventorySchema.safeParse({
      inventoryId: item.id,
      stockCount: Number(data.get("stockCount")),
      location: data.get("location") ?? "",
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid inventory details.");
      return;
    }
    setPendingId(item.id);
    const result = await updateDealerInventoryAction(parsed.data);
    setPendingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Inventory updated.");
    router.refresh();
  }

  async function deleteItem(item: DealerInventoryDto) {
    if (!window.confirm("Remove this inventory record? This cannot be undone.")) return;
    setPendingId(item.id);
    const result = await removeDealerInventoryAction({ inventoryId: item.id });
    setPendingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Inventory record removed.");
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="bg-card h-fit rounded-2xl border p-5 sm:p-6">
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <Plus className="text-primary size-4" aria-hidden="true" />
            <h2 className="font-semibold">Add stock record</h2>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Track stock by SKU and branch or storage location.
          </p>
        </div>
        <form onSubmit={addItem} className="space-y-4" noValidate>
          <Field name="sku" label="SKU" placeholder="Optional internal reference" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="stockCount"
              label="Quantity"
              placeholder="1"
              type="number"
              min={1}
              required
            />
            <Field
              name="costPrice"
              label="Unit cost (PKR)"
              placeholder="Optional"
              type="number"
              min={0.01}
              step="0.01"
            />
          </div>
          <Field name="location" label="Branch / storage location" placeholder="Main branch" />
          {errors.length ? (
            <ul className="text-destructive space-y-1 text-sm" role="alert">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
          <Button type="submit" className="min-h-11 w-full" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Add inventory
          </Button>
        </form>
      </section>

      <section className="bg-card overflow-hidden rounded-2xl border">
        <div className="border-b p-5 sm:p-6">
          <h2 className="font-semibold">Inventory</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {inventory.length} {inventory.length === 1 ? "record" : "records"}
          </p>
        </div>
        {inventory.length ? (
          <ul className="divide-y">
            {inventory.map((item) => (
              <li key={item.id} className="space-y-3 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Package className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.sku || "Unassigned SKU"}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.location || "No location"}
                        {item.costPrice !== null
                          ? ` · ${currency.format(item.costPrice)} unit cost`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Remove inventory record"
                    className="text-destructive hover:text-destructive size-9 shrink-0"
                    disabled={pendingId === item.id}
                    onClick={() => deleteItem(item)}
                  >
                    {pendingId === item.id ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="size-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
                <form
                  onSubmit={(event) => saveItem(event, item)}
                  className="grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]"
                >
                  <div className="grid gap-1.5">
                    <Label htmlFor={`stock-${item.id}`} className="text-xs">
                      Quantity
                    </Label>
                    <Input
                      id={`stock-${item.id}`}
                      name="stockCount"
                      type="number"
                      min={0}
                      max={100000}
                      required
                      defaultValue={item.stockCount}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`location-${item.id}`} className="text-xs">
                      Location
                    </Label>
                    <Input
                      id={`location-${item.id}`}
                      name="location"
                      maxLength={100}
                      defaultValue={item.location ?? ""}
                      placeholder="Branch or storage"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="min-h-10 self-end"
                    disabled={pendingId === item.id}
                  >
                    {pendingId === item.id ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : null}
                    Save
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-12 text-center">
            <Package className="text-muted-foreground mx-auto size-8" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">No inventory records yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Add your first stock record to get started.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  min,
  step,
  required = false,
}: {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  min?: number;
  step?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={`inventory-${name}`}>
        {label}
        {required ? " *" : ""}
      </Label>
      <Input
        id={`inventory-${name}`}
        name={name}
        type={type}
        min={min}
        step={step}
        placeholder={placeholder}
        required={required}
        maxLength={name === "sku" ? 50 : undefined}
      />
    </div>
  );
}
