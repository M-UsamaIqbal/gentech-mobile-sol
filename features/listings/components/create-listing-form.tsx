"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { LISTING_CONDITION_LABELS, PTA_STATUS, CPID_STATUS, NETWORK_TYPE, WARRANTY_TYPE, ROUTES } from "@/lib/constants";
import {
  ACCESSORY_TYPE_OPTIONS,
  COMPATIBILITY_OPTIONS,
  CONNECTIVITY_OPTIONS,
  getCategoryFilterProfile,
  OPERATING_SYSTEM_OPTIONS,
  PROCESSOR_OPTIONS,
  SCREEN_SIZE_OPTIONS,
} from "@/lib/catalog/category-filters";
import type { BrandItem, CategoryItem } from "@/types/marketplace";
import type { LocationTree } from "@/features/locations/services/location.service";
import { LocationPicker, type LocationSelection } from "@/features/locations/components/location-picker";
import {
  createListingSchema,
  type CreateListingInput,
  type UploadedImage,
  type UploadedModel,
} from "@/features/listings/schemas/create-listing";
import { createListingAction } from "@/features/listings/actions/create-listing";
import { trackCreateListing } from "@/features/analytics/lib/events";
import { ImageUploader } from "./image-uploader";
import { ModelUploader } from "./model-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClass =
  "border-input bg-background h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 outline-none";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-destructive text-sm">{message}</p>;
}

export function CreateListingForm({
  categories,
  brands,
  locations,
  showPakistanSignals = true,
}: {
  categories: CategoryItem[];
  brands: BrandItem[];
  locations: LocationTree;
  showPakistanSignals?: boolean;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateListingInput>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      images: [],
      model3d: null,
      negotiable: false,
      ptaApproved: false,
      ptaStatus: undefined,
      cpidStatus: undefined,
      countryId: "",
      cityId: "",
      areaId: "",
    },
  });

  const images = useWatch({ control, name: "images" }) ?? [];
  const model3d = useWatch({ control, name: "model3d" }) ?? null;
  const countryId = useWatch({ control, name: "countryId" }) ?? "";
  const cityId = useWatch({ control, name: "cityId" }) ?? "";
  const areaId = useWatch({ control, name: "areaId" }) ?? "";
  const categorySlug = useWatch({ control, name: "categorySlug" }) ?? "";
  const profile = getCategoryFilterProfile(categorySlug || undefined);
  const shows = (key: (typeof profile.filters)[number]) => profile.filters.includes(key);

  function setImages(next: UploadedImage[]) {
    setValue("images", next, { shouldValidate: true });
  }

  function setModel3d(next: UploadedModel | null) {
    setValue("model3d", next, { shouldValidate: true });
  }

  async function onSubmit(values: CreateListingInput) {
    const result = await createListingAction(values);
    if (!result.ok) {
      toast.error(result.error ?? "Could not create the listing.");
      return;
    }
    toast.success("Listing submitted! It will go live once approved by our team.");
    if (result.id) trackCreateListing({ id: result.id, price: values.price });
    router.push(result.slug ? `/listings/${result.slug}` : ROUTES.dashboard);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {/* Photos */}
      <section className="space-y-2">
        <Label>Photos</Label>
        <ImageUploader value={images} onChange={setImages} allowUrl />
        <FieldError message={errors.images?.message} />
      </section>

      {/* Optional 3D model — genuine upload or labelled browser-generated approximation. */}
      <section className="space-y-2">
        <ModelUploader value={model3d} onChange={setModel3d} sourceImages={images} />
        {errors.model3d ? (
          <FieldError
            message={
              (errors.model3d as { message?: string } | undefined)?.message ??
              "Check the 3D model details and try again."
            }
          />
        ) : null}
      </section>

      {/* Basics */}
      <section className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="e.g. iPhone 15 Pro Max 256GB — PTA Approved"
            {...register("title")}
          />
          <FieldError message={errors.title?.message} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={5}
            placeholder="Condition, warranty, accessories included, reason for selling…"
            {...register("description")}
          />
          <FieldError message={errors.description?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              inputMode="numeric"
              placeholder="84999"
              {...register("price", { valueAsNumber: true })}
            />
            <FieldError message={errors.price?.message} />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4" {...register("negotiable")} />
              Price is negotiable
            </label>
          </div>
        </div>
      </section>

      {/* Classification */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="categorySlug">Category</Label>
          <select
            id="categorySlug"
            className={selectClass}
            defaultValue=""
            {...register("categorySlug")}
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError message={errors.categorySlug?.message} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="brandSlug">Brand (optional)</Label>
          <select id="brandSlug" className={selectClass} defaultValue="" {...register("brandSlug")}>
            <option value="">No brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="condition">Condition</Label>
          <select id="condition" className={selectClass} defaultValue="" {...register("condition")}>
            <option value="" disabled>
              Select condition
            </option>
            {Object.entries(LISTING_CONDITION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <FieldError message={errors.condition?.message} />
        </div>

        <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
          <LocationPicker
            locations={locations}
            prefix="listing-location"
            value={{ countryId, cityId, areaId: areaId ?? "" }}
            onChange={(selection: LocationSelection) => {
              setValue("countryId", selection.countryId, { shouldValidate: true });
              setValue("cityId", selection.cityId, { shouldValidate: true });
              setValue("areaId", selection.areaId, { shouldValidate: true });
            }}
          />
          <input type="hidden" {...register("countryId")} />
          <input type="hidden" {...register("cityId")} />
          <input type="hidden" {...register("areaId")} />
          <FieldError message={errors.countryId?.message ?? errors.cityId?.message ?? errors.areaId?.message} />
          {locations.length === 0 ? (
            <p className="text-muted-foreground text-sm sm:col-span-3">
              Locations are temporarily unavailable. Please try again later.
            </p>
          ) : null}
        </div>
      </section>

      {/* Category-aware specifications */}
      <section className="grid gap-4">
        <h3 className="text-sm font-semibold">Specifications (optional)</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {shows("storage") ? (
            <div className="grid gap-2">
              <Label htmlFor="storage">Storage</Label>
              <Input id="storage" placeholder="256GB" {...register("storage")} />
            </div>
          ) : null}
          {shows("ram") ? (
            <div className="grid gap-2">
              <Label htmlFor="ram">RAM</Label>
              <Input id="ram" placeholder="8GB" {...register("ram")} />
            </div>
          ) : null}
          {shows("color") ? (
            <div className="grid gap-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" placeholder="Titanium Blue" {...register("color")} />
            </div>
          ) : null}
          {shows("batteryHealthMin") ? (
            <div className="grid gap-2">
              <Label htmlFor="batteryHealth">Battery health (%)</Label>
              <Input
                id="batteryHealth"
                inputMode="numeric"
                placeholder="92"
                {...register("batteryHealth")}
              />
              <FieldError message={errors.batteryHealth?.message} />
            </div>
          ) : null}
          {shows("processor") ? (
            <div className="grid gap-2">
              <Label htmlFor="processor">Processor / Chipset</Label>
              <select id="processor" className={selectClass} defaultValue="" {...register("processor")}>
                <option value="">Unknown</option>
                {PROCESSOR_OPTIONS.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
          ) : null}
          {shows("operatingSystem") ? (
            <div className="grid gap-2">
              <Label htmlFor="operatingSystem">Operating System</Label>
              <select id="operatingSystem" className={selectClass} defaultValue="" {...register("operatingSystem")}>
                <option value="">Unknown</option>
                {OPERATING_SYSTEM_OPTIONS.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
          ) : null}
          {shows("screenSize") ? (
            <div className="grid gap-2">
              <Label htmlFor="screenSize">Screen Size</Label>
              <select id="screenSize" className={selectClass} defaultValue="" {...register("screenSize")}>
                <option value="">Unknown</option>
                {SCREEN_SIZE_OPTIONS.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
          ) : null}
          {shows("connectivity") ? (
            <div className="grid gap-2">
              <Label htmlFor="connectivity">Connectivity</Label>
              <select id="connectivity" className={selectClass} defaultValue="" {...register("connectivity")}>
                <option value="">Unknown</option>
                {CONNECTIVITY_OPTIONS.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
          ) : null}
          {shows("accessoryType") ? (
            <div className="grid gap-2">
              <Label htmlFor="accessoryType">Accessory Type</Label>
              <select id="accessoryType" className={selectClass} defaultValue="" {...register("accessoryType")}>
                <option value="">Unknown</option>
                {ACCESSORY_TYPE_OPTIONS.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
          ) : null}
          {shows("compatibility") ? (
            <div className="grid gap-2">
              <Label htmlFor="compatibility">Compatibility</Label>
              <select id="compatibility" className={selectClass} defaultValue="" {...register("compatibility")}>
                <option value="">Unknown</option>
                {COMPATIBILITY_OPTIONS.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
          ) : null}
          {showPakistanSignals && shows("ptaStatus") ? (
            <>
              <div className="flex items-end pb-2 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4" {...register("ptaApproved")} />
                  PTA approved
                </label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ptaStatus">PTA Status (optional)</Label>
                <select id="ptaStatus" className={selectClass} defaultValue="" {...register("ptaStatus")}>
                  <option value="">Unknown</option>
                  {Object.entries(PTA_STATUS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}
          {showPakistanSignals && shows("cpidStatus") ? (
            <div className="grid gap-2">
              <Label htmlFor="cpidStatus">CPID Status (optional)</Label>
              <select id="cpidStatus" className={selectClass} defaultValue="" {...register("cpidStatus")}>
                <option value="">Unknown</option>
                {Object.entries(CPID_STATUS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      </section>

      {/* Extended phone details */}
      <section className="grid gap-4">
        <h3 className="text-sm font-semibold">Extended Details (optional)</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="model">Model</Label>
            <Input id="model" placeholder="iPhone 15 Pro" {...register("model")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="variant">Variant</Label>
            <Input id="variant" placeholder="Max" {...register("variant")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="networkType">Network Type</Label>
            <select id="networkType" className={selectClass} defaultValue="" {...register("networkType")}>
              <option value="">Unknown</option>
              {Object.entries(NETWORK_TYPE).map(([value, label]) => (
                <option key={value} value={value}>
                  {label.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="carrier">Carrier</Label>
            <Input id="carrier" placeholder="e.g. Jazz, Telenor" {...register("carrier")} />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4" {...register("isUnlocked")} />
              Unlocked
            </label>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="warranty">Warranty</Label>
            <select id="warranty" className={selectClass} defaultValue="" {...register("warranty")}>
              <option value="">Unknown</option>
              {Object.entries(WARRANTY_TYPE).map(([value, label]) => (
                <option key={value} value={value}>
                  {label.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
            <Input id="warrantyExpiry" type="date" {...register("warrantyExpiry")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="modelNumber">Model Number</Label>
            <Input id="modelNumber" placeholder="A3101" {...register("modelNumber")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="region">Region</Label>
            <Input id="region" placeholder="e.g. USA, HK, UAE" {...register("region")} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-2 pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4" {...register("hasOriginalBox")} />
              Original Box
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4" {...register("hasCharger")} />
              Charger
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4" {...register("hasHeadphones")} />
              Headphones
            </label>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="repairHistory">Repair History</Label>
            <Textarea id="repairHistory" rows={2} placeholder="Any repairs or replacements (screen, battery, etc.)" {...register("repairHistory")} />
          </div>
        </div>
      </section>

      <Button type="submit" size="lg" disabled={isSubmitting} className={cn("w-full sm:w-auto")}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Publish listing
      </Button>
    </form>
  );
}
