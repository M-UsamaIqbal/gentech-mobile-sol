"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Plus, Power } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addBranchAction, setDealerBranchStatusAction } from "../actions/dealer.actions";
import { createBranchSchema } from "../schemas/dealer";
import type { DealerBranchDto } from "../types";

export function BranchManager({
  dealerId,
  branches,
}: {
  dealerId: string;
  branches: DealerBranchDto[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);

  async function createBranch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = createBranchSchema.safeParse({
      dealerId,
      name: formData.get("name"),
      address: formData.get("address"),
      city: formData.get("city"),
      phone: formData.get("phone") || undefined,
      email: formData.get("email") || undefined,
    });

    if (!parsed.success) {
      setErrors(parsed.error.issues.map((issue) => issue.message));
      return;
    }

    setErrors([]);
    setSubmitting(true);
    const result = await addBranchAction(parsed.data);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    form.reset();
    toast.success("Branch added.");
    router.refresh();
  }

  async function toggleBranch(branch: DealerBranchDto) {
    setPendingId(branch.id);
    const result = await setDealerBranchStatusAction({
      branchId: branch.id,
      isActive: !branch.isActive,
    });
    setPendingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(branch.isActive ? "Branch deactivated." : "Branch activated.");
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="bg-card h-fit rounded-2xl border p-5 sm:p-6">
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <Plus className="text-primary size-4" aria-hidden="true" />
            <h2 className="font-semibold">Add a branch</h2>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Add another place where customers can visit your store.
          </p>
        </div>
        <form onSubmit={createBranch} className="space-y-4" noValidate>
          <Field name="name" label="Branch name" placeholder="Main branch" required />
          <Field name="address" label="Street address" placeholder="Street and area" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="city" label="City" placeholder="Karachi" required />
            <Field name="phone" label="Phone" placeholder="+92 300 1234567" type="tel" />
          </div>
          <Field name="email" label="Branch email" placeholder="branch@example.com" type="email" />
          {errors.length ? (
            <ul className="text-destructive space-y-1 text-sm" role="alert">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
          <Button type="submit" className="min-h-11 w-full" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Add branch
          </Button>
        </form>
      </section>

      <section className="bg-card overflow-hidden rounded-2xl border">
        <div className="border-b p-5 sm:p-6">
          <h2 className="font-semibold">Your branches</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {branches.length} {branches.length === 1 ? "location" : "locations"}
          </p>
        </div>
        {branches.length ? (
          <ul className="divide-y">
            {branches.map((branch) => (
              <li
                key={branch.id}
                className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <MapPin className="text-muted-foreground size-4" aria-hidden="true" />
                    <p className="font-medium">{branch.name}</p>
                    <Badge variant={branch.isActive ? "default" : "secondary"}>
                      {branch.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 pl-6 text-sm">
                    {branch.address}, {branch.city}
                  </p>
                  {branch.phone ? (
                    <p className="text-muted-foreground mt-1 pl-6 text-xs">{branch.phone}</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-10 shrink-0"
                  disabled={pendingId === branch.id}
                  onClick={() => toggleBranch(branch)}
                >
                  {pendingId === branch.id ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Power className="size-4" aria-hidden="true" />
                  )}
                  {branch.isActive ? "Deactivate" : "Activate"}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-12 text-center">
            <MapPin className="text-muted-foreground mx-auto size-8" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">No branches yet</p>
            <p className="text-muted-foreground mt-1 text-sm">Add your first store location.</p>
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
  required = false,
}: {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={`branch-${name}`}>
        {label}
        {required ? " *" : ""}
      </Label>
      <Input
        id={`branch-${name}`}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        maxLength={name === "address" ? 200 : 100}
      />
    </div>
  );
}
