"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PhoneModelWithBrand } from "@/features/phone-intelligence/repositories/phone-model.repository";
import type { Brand } from "@/lib/generated/prisma/client";
import {
  createModelAction,
  updateModelAction,
  deleteModelAction,
} from "@/features/admin/actions/catalog-admin.actions";

interface ModelManagerProps {
  models: PhoneModelWithBrand[];
  brands: Brand[];
}

export function ModelManager({ models, brands }: ModelManagerProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [selectedBrand, setSelectedBrand] = React.useState<string>("");
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  // New Model Form State
  const [name, setName] = React.useState("");
  const [brandId, setBrandId] = React.useState(brands[0]?.id ?? "");
  const [modelNumber, setModelNumber] = React.useState("");
  const [launchPrice, setLaunchPrice] = React.useState<number | undefined>();
  const [displaySize, setDisplaySize] = React.useState("");
  const [processor, setProcessor] = React.useState("");
  const [ramOptionsStr, setRamOptionsStr] = React.useState("");
  const [storageOptionsStr, setStorageOptionsStr] = React.useState("");
  const [batteryCapacity, setBatteryCapacity] = React.useState("");
  const [mainCamera, setMainCamera] = React.useState("");
  const [colorsStr, setColorsStr] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");

  // Edit Model State
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editPrice, setEditPrice] = React.useState<number | undefined>();
  const [updating, setUpdating] = React.useState(false);

  const filteredModels = React.useMemo(() => {
    return models.filter((m) => {
      const matchesSearch =
        !search.trim() ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.brand.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.modelNumber && m.modelNumber.toLowerCase().includes(search.toLowerCase()));

      const matchesBrand = !selectedBrand || m.brandId === selectedBrand;

      return matchesSearch && matchesBrand;
    });
  }, [models, search, selectedBrand]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Model name must be at least 2 characters.");
      return;
    }
    if (!brandId) {
      toast.error("Please select a brand.");
      return;
    }

    setCreating(true);
    const ramOptions = ramOptionsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const storageOptions = storageOptionsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const colors = colorsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await createModelAction({
      name: name.trim(),
      brandId,
      modelNumber: modelNumber.trim() || undefined,
      launchPrice: launchPrice ? Number(launchPrice) : undefined,
      displaySize: displaySize.trim() || undefined,
      processor: processor.trim() || undefined,
      ramOptions,
      storageOptions,
      batteryCapacity: batteryCapacity.trim() || undefined,
      mainCamera: mainCamera.trim() || undefined,
      colors,
      imageUrl: imageUrl.trim() || undefined,
    });
    setCreating(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    toast.success("Phone model created.");
    setName("");
    setModelNumber("");
    setLaunchPrice(undefined);
    setDisplaySize("");
    setProcessor("");
    setBatteryCapacity("");
    setMainCamera("");
    setImageUrl("");
    setShowAddForm(false);
    router.refresh();
  }

  async function handleToggleActive(model: PhoneModelWithBrand) {
    const res = await updateModelAction({
      id: model.id,
      isActive: !model.isActive,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Model ${!model.isActive ? "activated" : "deactivated"}.`);
    router.refresh();
  }

  function startEdit(model: PhoneModelWithBrand) {
    setEditingId(model.id);
    setEditName(model.name);
    setEditPrice(model.launchPrice ? Number(model.launchPrice) : undefined);
  }

  async function saveEdit(id: string) {
    setUpdating(true);
    const res = await updateModelAction({
      id,
      name: editName.trim(),
      launchPrice: editPrice ? Number(editPrice) : null,
    });
    setUpdating(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    toast.success("Phone model updated.");
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    const res = await deleteModelAction(id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    toast.success("Phone model deleted.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-300 uppercase">
            Marketplace catalog
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Phone model catalog
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Define dynamic specifications, RAM variants, storage options, and colors.
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-[minmax(12rem,14rem)_auto_auto]">
          <div className="relative min-w-0">
            <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models…"
              aria-label="Search phone models"
              className="border-white/10 bg-[#1F1F1F] pl-9 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="relative">
            <label htmlFor="model-brand-filter" className="sr-only">
              Filter by brand
            </label>
            <select
              id="model-brand-filter"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="h-10 w-full rounded-lg border border-white/10 bg-[#1F1F1F] px-3 text-xs text-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            >
              <option value="">All Brands ({models.length})</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={brands.length === 0}
            className="min-h-10 bg-emerald-400 font-semibold text-slate-950 hover:bg-emerald-300"
            title={brands.length === 0 ? "Create a brand before adding a phone model" : undefined}
          >
            <Plus className="mr-1.5 size-4" />
            {showAddForm ? "Cancel" : "Add Model"}
          </Button>
        </div>
      </header>

      <div
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-[#1F1F1F] px-4 py-3 text-xs"
        aria-live="polite"
      >
        <p className="text-slate-400">
          Showing <span className="font-semibold text-slate-100">{filteredModels.length}</span> of{" "}
          <span className="font-semibold text-slate-100">{models.length}</span> models
        </p>
        <p className="text-slate-500">
          {models.filter((model) => model.isActive).length} active ·{" "}
          {models.length - models.filter((model) => model.isActive).length} inactive
        </p>
      </div>

      {brands.length === 0 && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs leading-5 text-amber-100/80">
          Add and activate a brand before creating phone models.
        </div>
      )}

      {/* Add Model Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-5 rounded-xl border border-white/10 bg-[#1F1F1F] p-6 shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-semibold text-white">
              Create New Phone Model & Specifications
            </h3>
            <span className="text-xs text-slate-400">
              Values populate dynamic marketplace filters
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="model-create-brand"
                className="mb-1 block text-xs font-medium text-slate-400"
              >
                Brand *
              </label>
              <select
                id="model-create-brand"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="h-9 w-full rounded-md border border-white/10 bg-[#0e0f12] px-3 text-xs text-white"
                required
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="model-create-name"
                className="mb-1 block text-xs font-medium text-slate-400"
              >
                Model Name *
              </label>
              <Input
                id="model-create-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Official model name"
                required
                className="border-white/10 bg-[#0e0f12] text-white"
              />
            </div>
            <div>
              <label
                htmlFor="model-create-number"
                className="mb-1 block text-xs font-medium text-slate-400"
              >
                Model Number (optional)
              </label>
              <Input
                id="model-create-number"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                placeholder="Manufacturer model number"
                className="border-white/10 bg-[#0e0f12] text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label
                htmlFor="model-create-price"
                className="mb-1 block text-xs font-medium text-slate-400"
              >
                Launch Price (PKR)
              </label>
              <Input
                id="model-create-price"
                type="number"
                value={launchPrice ?? ""}
                onChange={(e) =>
                  setLaunchPrice(e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="e.g. 450000"
                min={0}
                className="border-white/10 bg-[#0e0f12] text-white"
              />
            </div>
            <div>
              <label
                htmlFor="model-create-display"
                className="mb-1 block text-xs font-medium text-slate-400"
              >
                Display Size
              </label>
              <Input
                id="model-create-display"
                value={displaySize}
                onChange={(e) => setDisplaySize(e.target.value)}
                placeholder="Screen size and panel details"
                className="border-white/10 bg-[#0e0f12] text-white"
              />
            </div>
            <div>
              <label
                htmlFor="model-create-processor"
                className="mb-1 block text-xs font-medium text-slate-400"
              >
                Processor (Chipset)
              </label>
              <Input
                id="model-create-processor"
                value={processor}
                onChange={(e) => setProcessor(e.target.value)}
                placeholder="Processor name"
                className="border-white/10 bg-[#0e0f12] text-white"
              />
            </div>
            <div>
              <label
                htmlFor="model-create-battery"
                className="mb-1 block text-xs font-medium text-slate-400"
              >
                Battery Capacity
              </label>
              <Input
                id="model-create-battery"
                value={batteryCapacity}
                onChange={(e) => setBatteryCapacity(e.target.value)}
                placeholder="Battery capacity and charging details"
                className="border-white/10 bg-[#0e0f12] text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="model-create-ram"
                className="mb-1 block text-xs font-medium text-slate-400"
              >
                RAM Variants (comma separated)
              </label>
              <Input
                id="model-create-ram"
                value={ramOptionsStr}
                onChange={(e) => setRamOptionsStr(e.target.value)}
                placeholder="Comma-separated supported RAM options"
                className="border-white/10 bg-[#0e0f12] text-white"
              />
            </div>
            <div>
              <label
                htmlFor="model-create-storage"
                className="mb-1 block text-xs font-medium text-slate-400"
              >
                Storage Variants (comma separated)
              </label>
              <Input
                id="model-create-storage"
                value={storageOptionsStr}
                onChange={(e) => setStorageOptionsStr(e.target.value)}
                placeholder="Comma-separated supported storage options"
                className="border-white/10 bg-[#0e0f12] text-white"
              />
            </div>
            <div>
              <label
                htmlFor="model-create-colors"
                className="mb-1 block text-xs font-medium text-slate-400"
              >
                Available Colors (comma separated)
              </label>
              <Input
                id="model-create-colors"
                value={colorsStr}
                onChange={(e) => setColorsStr(e.target.value)}
                placeholder="Comma-separated official color names"
                className="border-white/10 bg-[#0e0f12] text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="model-create-camera"
                className="mb-1 block text-xs font-medium text-slate-400"
              >
                Main Camera Specs
              </label>
              <Input
                id="model-create-camera"
                value={mainCamera}
                onChange={(e) => setMainCamera(e.target.value)}
                placeholder="Camera configuration"
                className="border-white/10 bg-[#0e0f12] text-white"
              />
            </div>
            <div>
              <label
                htmlFor="model-create-image-url"
                className="mb-1 block text-xs font-medium text-slate-400"
              >
                Official Image URL
              </label>
              <Input
                id="model-create-image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Model image URL"
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
              className="bg-emerald-400 font-semibold text-slate-950 hover:bg-emerald-300"
            >
              {creating ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
              Save Phone Model
            </Button>
          </div>
        </form>
      )}

      {/* Models Table */}
      <section
        aria-label="Phone model catalog"
        className="overflow-hidden rounded-xl border border-white/10 bg-[#1F1F1F]"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm text-slate-300">
            <thead className="border-b border-white/10 bg-[#181818] text-xs font-semibold tracking-wider text-slate-400 uppercase">
              <tr>
                <th className="px-6 py-4">Phone Model</th>
                <th className="px-4 py-4">Brand</th>
                <th className="px-4 py-4">Storage Variants</th>
                <th className="px-4 py-4">RAM Variants</th>
                <th className="px-4 py-4">Specs Summary</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredModels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No phone models found matching the criteria. Click &quot;Add Model&quot; to
                    register one.
                  </td>
                </tr>
              ) : (
                filteredModels.map((model) => {
                  const isEditing = editingId === model.id;
                  return (
                    <tr key={model.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div className="space-y-1">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-8 border-white/20 bg-[#0e0f12] text-xs text-white"
                            />
                            <Input
                              type="number"
                              value={editPrice ?? ""}
                              onChange={(e) =>
                                setEditPrice(e.target.value ? Number(e.target.value) : undefined)
                              }
                              placeholder="Launch Price PKR"
                              className="h-7 border-white/20 bg-[#0e0f12] text-xs text-white"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            {model.imageUrl ? (
                              <img
                                src={model.imageUrl}
                                alt={model.name}
                                className="size-8 rounded bg-white/10 object-contain p-0.5"
                              />
                            ) : (
                              <div className="flex size-8 items-center justify-center rounded bg-emerald-500/10 text-xs font-bold text-emerald-400">
                                📱
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-white">{model.name}</div>
                              {model.launchPrice ? (
                                <div className="text-xs text-slate-400">
                                  Launch: PKR {Number(model.launchPrice).toLocaleString()}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="border-white/10 text-slate-300">
                          {model.brand.name}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex max-w-[200px] flex-wrap gap-1">
                          {model.storageOptions.length > 0 ? (
                            model.storageOptions.map((s) => (
                              <span
                                key={s}
                                className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-xs text-slate-300"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex max-w-[150px] flex-wrap gap-1">
                          {model.ramOptions.length > 0 ? (
                            model.ramOptions.map((r) => (
                              <span
                                key={r}
                                className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-xs text-slate-300"
                              >
                                {r}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </div>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-4 text-xs text-slate-400">
                        {[model.displaySize, model.processor, model.batteryCapacity]
                          .filter(Boolean)
                          .join(" • ") || "No specs entered"}
                      </td>
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(model)}
                          className="cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                          title={`${model.isActive ? "Deactivate" : "Activate"} ${model.name}`}
                          aria-label={`${model.isActive ? "Deactivate" : "Activate"} ${model.name}`}
                          aria-pressed={model.isActive}
                        >
                          {model.isActive ? (
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
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => saveEdit(model.id)}
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
                              onClick={() => startEdit(model)}
                              className="size-8 p-0 text-slate-400 hover:text-white"
                              title="Edit Model"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(model.id, model.name)}
                              className="size-8 p-0 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                              title="Delete Model"
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
