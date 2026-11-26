"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminBrandItem } from "@/features/admin/repositories/brand.repository";
import {
  createBrandAction,
  updateBrandAction,
  deleteBrandAction,
} from "@/features/admin/actions/catalog-admin.actions";

interface BrandManagerProps {
  brands: AdminBrandItem[];
}

export function BrandManager({ brands }: BrandManagerProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [showAddForm, setShowAddForm] = React.useState(false);

  // New Brand Form State
  const [newName, setNewName] = React.useState("");
  const [newSlug, setNewSlug] = React.useState("");
  const [newLogo, setNewLogo] = React.useState("");
  const [newPosition, setNewPosition] = React.useState(0);

  // Editing State
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editLogo, setEditLogo] = React.useState("");
  const [editPosition, setEditPosition] = React.useState(0);
  const [updating, setUpdating] = React.useState(false);

  const filteredBrands = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter(
      (b) => b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q),
    );
  }, [brands, search]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (newName.trim().length < 2) {
      toast.error("Brand name must be at least 2 characters.");
      return;
    }

    setCreating(true);
    const res = await createBrandAction({
      name: newName.trim(),
      slug: newSlug.trim() || undefined,
      logo: newLogo.trim() || undefined,
      position: Number(newPosition) || 0,
    });
    setCreating(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    toast.success("Brand created successfully.");
    setNewName("");
    setNewSlug("");
    setNewLogo("");
    setNewPosition(0);
    setShowAddForm(false);
    router.refresh();
  }

  async function handleToggleActive(brand: AdminBrandItem) {
    const res = await updateBrandAction({
      id: brand.id,
      isActive: !brand.isActive,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Brand ${!brand.isActive ? "activated" : "deactivated"}.`);
    router.refresh();
  }

  function startEdit(brand: AdminBrandItem) {
    setEditingId(brand.id);
    setEditName(brand.name);
    setEditLogo(brand.logo ?? "");
    setEditPosition(brand.position);
  }

  async function saveEdit(id: string) {
    setUpdating(true);
    const res = await updateBrandAction({
      id,
      name: editName.trim(),
      logo: editLogo.trim(),
      position: Number(editPosition) || 0,
    });
    setUpdating(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    toast.success("Brand updated.");
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string, name: string) {
    if (
      !confirm(`Are you sure you want to delete ${name}? This will affect all associated models.`)
    ) {
      return;
    }

    const res = await deleteBrandAction(id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    toast.success("Brand deleted.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-300 uppercase">
            Marketplace catalog
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Brand management
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Create and organize smartphone and electronics brands dynamically.
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-[minmax(12rem,16rem)_auto]">
          <div className="relative min-w-0">
            <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brands…"
              aria-label="Search brands"
              className="border-white/10 bg-[#1F1F1F] pl-9 text-white placeholder:text-slate-500"
            />
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="min-h-10 bg-emerald-400 font-semibold text-slate-950 hover:bg-emerald-300"
          >
            <Plus className="mr-1.5 size-4" />
            {showAddForm ? "Cancel" : "Add Brand"}
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-white/[0.07] bg-[#1F1F1F] px-4 py-3 text-xs">
        <span className="font-semibold text-slate-100">{brands.length.toLocaleString()}</span>
        <span className="text-slate-500">total brands</span>
        <span className="hidden h-4 w-px bg-white/10 sm:block" aria-hidden="true" />
        <span className="font-semibold text-emerald-300">
          {brands.filter((brand) => brand.isActive).length.toLocaleString()}
        </span>
        <span className="text-slate-500">active</span>
        <span className="ml-auto text-slate-500">
          Showing {filteredBrands.length.toLocaleString()} matching results
        </span>
      </div>

      {/* Add Brand Inline Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-xl border border-white/10 bg-[#1F1F1F] p-5 shadow-lg"
        >
          <h3 className="text-sm font-semibold text-white">Create New Mobile Brand</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label
                htmlFor="brand-create-name"
                className="mb-1 block text-xs font-medium text-slate-400"
              >
                Brand Name *
              </label>
              <Input
                id="brand-create-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Official brand name"
                required
                className="border-white/10 bg-[#0e0f12] text-white"
              />
            </div>
            <div>
              <label
                htmlFor="brand-create-slug"
                className="mb-1 block text-xs font-medium text-slate-400"
              >
                Custom Slug (optional)
              </label>
              <Input
                id="brand-create-slug"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="URL-friendly identifier"
                className="border-white/10 bg-[#0e0f12] text-white"
              />
            </div>
            <div>
              <label
                htmlFor="brand-create-logo"
                className="mb-1 block text-xs font-medium text-slate-400"
              >
                Logo Image URL
              </label>
              <Input
                id="brand-create-logo"
                value={newLogo}
                onChange={(e) => setNewLogo(e.target.value)}
                placeholder="Logo image URL"
                className="border-white/10 bg-[#0e0f12] text-white"
              />
            </div>
            <div>
              <label
                htmlFor="brand-create-position"
                className="mb-1 block text-xs font-medium text-slate-400"
              >
                Display Order
              </label>
              <Input
                id="brand-create-position"
                type="number"
                value={newPosition}
                onChange={(e) => setNewPosition(Number(e.target.value))}
                min={0}
                className="border-white/10 bg-[#0e0f12] text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="bg-emerald-500 font-semibold text-slate-950 hover:bg-emerald-600"
            >
              {creating ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
              Save Brand
            </Button>
          </div>
        </form>
      )}

      {/* Brands Table */}
      <section
        aria-label="Brand catalog"
        className="overflow-hidden rounded-xl border border-white/10 bg-[#1F1F1F]"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm text-slate-300">
            <thead className="border-b border-white/10 bg-[#181818] text-xs font-semibold tracking-wider text-slate-400 uppercase">
              <tr>
                <th className="px-6 py-4">Brand</th>
                <th className="px-4 py-4">Slug</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4 text-center">Phone Models</th>
                <th className="px-4 py-4 text-center">Active Listings</th>
                <th className="px-4 py-4 text-center">Order</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No brands found. Click &quot;Add Brand&quot; to create one.
                  </td>
                </tr>
              ) : (
                filteredBrands.map((brand) => {
                  const isEditing = editingId === brand.id;
                  return (
                    <tr key={brand.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 border-white/20 bg-[#0e0f12] text-xs text-white"
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            {brand.logo ? (
                              <img
                                src={brand.logo}
                                alt={brand.name}
                                className="size-7 rounded-lg bg-white/10 object-contain p-0.5"
                              />
                            ) : (
                              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-xs font-bold text-emerald-400">
                                {brand.name.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <span className="font-semibold text-white">{brand.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-400">{brand.slug}</td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleToggleActive(brand)}
                          className="cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                          title={`${brand.isActive ? "Deactivate" : "Activate"} ${brand.name}`}
                          aria-label={`${brand.isActive ? "Deactivate" : "Activate"} ${brand.name}`}
                          aria-pressed={brand.isActive}
                        >
                          {brand.isActive ? (
                            <Badge className="border-emerald-500/30 bg-emerald-500/20 text-xs text-emerald-300">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="border-white/10 bg-slate-800 text-xs text-slate-400">
                              Inactive
                            </Badge>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-center font-medium text-slate-300">
                        {brand._count.phoneModels}
                      </td>
                      <td className="px-4 py-4 text-center font-medium text-slate-300">
                        {brand._count.listings}
                      </td>
                      <td className="px-4 py-4 text-center text-slate-400">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editPosition}
                            onChange={(e) => setEditPosition(Number(e.target.value))}
                            className="mx-auto h-8 w-16 border-white/20 bg-[#0e0f12] text-center text-xs text-white"
                          />
                        ) : (
                          brand.position
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => saveEdit(brand.id)}
                              disabled={updating}
                              className="size-8 bg-emerald-500 p-0 text-slate-950 hover:bg-emerald-600"
                            >
                              <Check className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(null)}
                              className="size-8 p-0 text-slate-400 hover:text-white"
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(brand)}
                              className="size-8 p-0 text-slate-400 hover:text-white"
                              title="Edit Brand"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(brand.id, brand.name)}
                              className="size-8 p-0 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                              title="Delete Brand"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
