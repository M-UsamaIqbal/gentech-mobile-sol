"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Store } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/lib/constants";
import { registerDealerAction, updateDealerAction } from "../actions/dealer.actions";
import { dealerFormSchema } from "../schemas/dealer";
import type { DealerDto } from "../types";

type DealerFormValues = z.infer<typeof dealerFormSchema>;

const fields = [
  {
    name: "businessName",
    label: "Registered business name",
    placeholder: "e.g. City Mobile Center",
  },
  {
    name: "businessType",
    label: "Business type",
    placeholder: "Retailer, distributor, or repair shop",
  },
  { name: "taxNumber", label: "NTN / tax number", placeholder: "Optional" },
  {
    name: "phone",
    label: "Public business WhatsApp number",
    placeholder: "+92 300 1234567",
    type: "tel",
  },
  { name: "email", label: "Business email", placeholder: "store@example.com", type: "email" },
  { name: "website", label: "Website", placeholder: "https://example.com", type: "url" },
  { name: "city", label: "City", placeholder: "e.g. Karachi" },
  { name: "address", label: "Business address", placeholder: "Street, area, and city" },
] as const;

export function DealerProfileForm({ dealer }: { dealer?: DealerDto }) {
  const router = useRouter();
  const isEditing = Boolean(dealer);
  const form = useForm<DealerFormValues>({
    resolver: zodResolver(dealerFormSchema),
    defaultValues: {
      name: dealer?.name ?? "",
      description: dealer?.description ?? "",
      businessName: dealer?.businessName ?? "",
      businessType: dealer?.businessType ?? "",
      taxNumber: dealer?.taxNumber ?? "",
      phone: dealer?.phone ?? "",
      email: dealer?.email ?? "",
      website: dealer?.website ?? "",
      city: dealer?.city ?? "",
      address: dealer?.address ?? "",
      logo: dealer?.logo ?? "",
      coverImage: dealer?.coverImage ?? "",
    },
  });

  async function onSubmit(values: DealerFormValues) {
    if (dealer) {
      const result = await updateDealerAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        dealer.status === "REJECTED"
          ? "Application updated and resubmitted for review."
          : "Dealer profile updated.",
      );
      router.refresh();
      return;
    }

    const result = await registerDealerAction(values);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Application submitted. Your profile is pending review.");
    router.push(ROUTES.dealerDashboard);
    router.refresh();
  }

  const { errors, isSubmitting } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7" noValidate>
      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Store className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold">Store identity</h2>
            <p className="text-muted-foreground text-sm">
              Tell buyers what to call your dealership.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="dealer-name">
              Store display name <span aria-hidden="true">*</span>
            </Label>
            <Input
              id="dealer-name"
              autoComplete="organization"
              placeholder="e.g. City Mobile Center"
              aria-invalid={Boolean(errors.name)}
              {...form.register("name")}
            />
            {errors.name?.message ? (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            ) : null}
          </div>

          {fields.map((field) => (
            <div className="grid gap-2" key={field.name}>
              <Label htmlFor={`dealer-${field.name}`}>{field.label}</Label>
              <Input
                id={`dealer-${field.name}`}
                type={"type" in field ? field.type : "text"}
                placeholder={field.placeholder}
                autoComplete={field.name === "businessName" ? "organization" : undefined}
                aria-invalid={Boolean(errors[field.name])}
                {...form.register(field.name)}
              />
              {field.name === "phone" ? (
                <p className="text-muted-foreground text-xs">
                  Buyers can use this number to contact your store from its listings.
                </p>
              ) : null}
              {errors[field.name]?.message ? (
                <p className="text-destructive text-sm">{errors[field.name]?.message}</p>
              ) : null}
            </div>
          ))}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="dealer-description">About your store</Label>
          <Textarea
            id="dealer-description"
            rows={4}
            maxLength={1000}
            placeholder="Share what you sell and what makes your store trustworthy."
            aria-invalid={Boolean(errors.description)}
            {...form.register("description")}
          />
          {errors.description?.message ? (
            <p className="text-destructive text-sm">{errors.description.message}</p>
          ) : null}
        </div>
      </section>

      {isEditing ? (
        <section className="space-y-4 border-t pt-6">
          <div>
            <h2 className="font-semibold">Profile images</h2>
            <p className="text-muted-foreground text-sm">
              Add image URLs for your store logo and cover.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["logo", "coverImage"] as const).map((name) => (
              <div className="grid gap-2" key={name}>
                <Label htmlFor={`dealer-${name}`}>
                  {name === "logo" ? "Logo URL" : "Cover image URL"}
                </Label>
                <Input
                  id={`dealer-${name}`}
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  aria-invalid={Boolean(errors[name])}
                  {...form.register(name)}
                />
                {errors[name]?.message ? (
                  <p className="text-destructive text-sm">{errors[name]?.message}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
        {isEditing ? (
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        ) : null}
        <Button type="submit" className="min-h-11" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {isEditing ? "Save profile" : "Submit application"}
        </Button>
      </div>
    </form>
  );
}
