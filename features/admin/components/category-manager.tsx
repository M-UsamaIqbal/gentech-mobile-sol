"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminCategoryRow } from "@/features/admin/types";
import {
  createCategoryAction,
  deleteCategoryAction,
  renameCategoryAction,
  setCategoryActiveAction,
} from "@/features/admin/actions/admin.actions";

interface CategoryManagerProps {
  categories: AdminCategoryRow[];
  parentOptions: Array<{ id: string; name: string }>;
}

export function CategoryManager({ categories, parentOptions }: CategoryManagerProps) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [parentId, setParentId] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Enter a category name (2–60 chars).");
      return;
    }
    setCreating(true);
    const result = await createCategoryAction({
      name: name.trim(),
      parentId: parentId || undefined,
    });
    setCreating(false);
    if (!result.ok) {
      toast.error(result.error ?? "Could not create category.");
      return;
    }
    toast.success("Category created");
    setName("");
    setParentId("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold tracking-[0.16em] text-emerald-300 uppercase">
          Marketplace catalog
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Categories
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Organize the categories buyers use to browse marketplace listings.
        </p>
      </header>

      <form
        onSubmit={create}
        className="bg-card flex flex-wrap items-end gap-3 rounded-xl border p-4"
      >
        <div className="flex-1">
          <label htmlFor="cat-name" className="mb-1 block text-sm font-medium">
            New category
          </label>
          <Input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tablets"
            maxLength={60}
          />
        </div>
        <div>
          <label htmlFor="cat-parent" className="mb-1 block text-sm font-medium">
            Parent (optional)
          </label>
          <select
            id="cat-parent"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          >
            <option value="">None (top level)</option>
            {parentOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={creating}>
          {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add
        </Button>
      </form>

      {categories.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-12 text-center text-sm">
          No categories yet. Create one above.
        </p>
      ) : (
        <div className="divide-y rounded-xl border">
          {categories.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryRow({ category }: { category: AdminCategoryRow }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(category.name);
  const [pending, setPending] = React.useState(false);

  async function run(action: () => Promise<{ ok: boolean; error?: string }>, message: string) {
    setPending(true);
    const result = await action();
    setPending(false);
    if (!result.ok) {
      toast.error(result.error ?? "Action failed.");
      return false;
    }
    toast.success(message);
    router.refresh();
    return true;
  }

  async function saveRename() {
    if (draft.trim().length < 2) {
      toast.error("Enter a valid name (2–60 chars).");
      return;
    }
    const ok = await run(
      () => renameCategoryAction({ categoryId: category.id, name: draft.trim() }),
      "Category renamed",
    );
    if (ok) setEditing(false);
  }

  return (
    <div className="flex items-center gap-3 p-3">
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={60}
              className="h-8 max-w-xs"
              autoFocus
            />
            <Button size="icon" className="size-8" onClick={saveRename} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => {
                setDraft(category.name);
                setEditing(false);
              }}
              aria-label="Cancel"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{category.name}</span>
            {category.parentName ? (
              <span className="text-muted-foreground text-xs">in {category.parentName}</span>
            ) : null}
            {!category.isActive ? <Badge variant="outline">Hidden</Badge> : null}
          </div>
        )}
        <p className="text-muted-foreground text-xs">
          /{category.slug} · {category.listingCount} listings
        </p>
      </div>

      {!editing ? (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setEditing(true)}
            aria-label={`Rename ${category.name}`}
            disabled={pending}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              run(
                () =>
                  setCategoryActiveAction({
                    categoryId: category.id,
                    isActive: !category.isActive,
                  }),
                category.isActive ? "Category hidden" : "Category shown",
              )
            }
            disabled={pending}
          >
            {category.isActive ? "Hide" : "Show"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-8", category.listingCount > 0 && "opacity-40")}
            onClick={() => {
              if (!window.confirm(`Delete “${category.name}”?`)) return;
              void run(() => deleteCategoryAction({ categoryId: category.id }), "Category deleted");
            }}
            aria-label={`Delete ${category.name}`}
            disabled={pending}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
