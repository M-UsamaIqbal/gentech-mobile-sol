"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, LogOut, MapPin, Phone, Save, UserRound } from "lucide-react";
import { toast } from "sonner";

import { signOut } from "@/lib/auth-client";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileAction } from "./actions";

export type AccountFormLabels = {
  fullName: string;
  phoneNumber: string;
  phoneHint: string;
  city: string;
  cityPlaceholder: string;
  bio: string;
  bioHint: string;
  personalInfo: string;
  aboutYou: string;
  accountActions: string;
  editDescription: string;
  saveChanges: string;
  saving: string;
  signOut: string;
  signingOut: string;
  saved: string;
  saveFailed: string;
  signOutFailed: string;
};

interface Props {
  name: string;
  bio: string;
  phone: string;
  city: string;
  labels: AccountFormLabels;
  variant?: "desktop" | "mobile";
}

export function AccountForm({
  name,
  bio,
  phone,
  city,
  labels,
  variant = "desktop",
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const [bioValue, setBioValue] = React.useState(bio);
  const fieldId = (field: string) => `${variant}-${field}`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const result = await updateProfileAction(new FormData(e.currentTarget));
    setSaving(false);
    if (result.ok) {
      toast.success(labels.saved);
      router.refresh();
    } else {
      toast.error(result.error ?? labels.saveFailed);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push(ROUTES.home);
          router.refresh();
        },
        onError: () => {
          toast.error(labels.signOutFailed);
          setSigningOut(false);
        },
      },
    });
  }

  if (variant === "mobile") {
    return (
      <form onSubmit={handleSubmit} className="space-y-4 pb-28">
        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
          <div className="flex items-center gap-3 border-b border-border/70 bg-muted/30 px-4 py-3">
            <span className="bg-brand-soft text-brand grid size-9 shrink-0 place-items-center rounded-xl">
              <UserRound aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">{labels.personalInfo}</h2>
              <p className="text-muted-foreground truncate text-xs">{labels.editDescription}</p>
            </div>
          </div>
          <div className="divide-y divide-border/70 px-4">
            <div className="space-y-1.5 py-3.5">
              <Label htmlFor={fieldId("name")} className="text-muted-foreground text-xs font-medium">
                {labels.fullName}
              </Label>
              <Input
                id={fieldId("name")}
                name="name"
                defaultValue={name}
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                className="h-11 rounded-xl bg-muted/40 text-sm"
              />
            </div>
            <div className="space-y-1.5 py-3.5">
              <Label htmlFor={fieldId("phone")} className="text-muted-foreground text-xs font-medium">
                {labels.phoneNumber}
              </Label>
              <div className="relative">
                <Phone
                  aria-hidden="true"
                  className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
                />
                <Input
                  id={fieldId("phone")}
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  dir="ltr"
                  defaultValue={phone}
                  placeholder="+92 300 0000000"
                  maxLength={20}
                  aria-describedby={fieldId("phone-hint")}
                  className="h-11 rounded-xl bg-muted/40 ps-9 text-start text-sm"
                />
              </div>
              <p id={fieldId("phone-hint")} className="text-muted-foreground text-[11px]">
                {labels.phoneHint}
              </p>
            </div>
            <div className="space-y-1.5 py-3.5">
              <Label htmlFor={fieldId("city")} className="text-muted-foreground text-xs font-medium">
                {labels.city}
              </Label>
              <div className="relative">
                <MapPin
                  aria-hidden="true"
                  className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
                />
                <Input
                  id={fieldId("city")}
                  name="city"
                  defaultValue={city}
                  placeholder={labels.cityPlaceholder}
                  maxLength={80}
                  autoComplete="address-level2"
                  className="h-11 rounded-xl bg-muted/40 ps-9 text-sm"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
          <div className="flex items-center gap-3 border-b border-border/70 bg-muted/30 px-4 py-3">
            <span className="bg-brand-soft text-brand grid size-9 shrink-0 place-items-center rounded-xl">
              <FileText aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">{labels.aboutYou}</h2>
              <p className="text-muted-foreground truncate text-xs">{labels.bioHint}</p>
            </div>
          </div>
          <div className="space-y-1.5 px-4 py-3.5">
            <Label htmlFor={fieldId("bio")} className="text-muted-foreground text-xs font-medium">
              {labels.bio}
            </Label>
            <Textarea
              id={fieldId("bio")}
              name="bio"
              value={bioValue}
              onChange={(event) => setBioValue(event.target.value)}
              placeholder={labels.bioHint}
              maxLength={300}
              rows={4}
              aria-describedby={fieldId("bio-count")}
              className="resize-none rounded-xl bg-muted/40 text-sm"
            />
            <p id={fieldId("bio-count")} dir="ltr" className="text-muted-foreground text-end text-[11px]">
              {bioValue.length}/300
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
          <div className="flex items-center gap-3 border-b border-border/70 bg-muted/30 px-4 py-3">
            <span className="bg-brand-soft text-brand grid size-9 shrink-0 place-items-center rounded-xl">
              <LogOut aria-hidden="true" className="size-4" />
            </span>
            <h2 className="text-sm font-semibold">{labels.accountActions}</h2>
          </div>
          <div className="p-2">
            <Button
              type="button"
              variant="ghost"
              disabled={signingOut}
              onClick={handleSignOut}
              className="text-destructive hover:bg-destructive/5 hover:text-destructive h-11 w-full justify-start gap-2 rounded-xl px-3 text-sm"
            >
              <LogOut aria-hidden="true" className="size-4" />
              {signingOut ? labels.signingOut : labels.signOut}
            </Button>
          </div>
        </section>

        <div
          data-mobile-save-bar
          className="bg-background/95 fixed inset-x-0 z-30 border-t border-border/70 px-4 pt-3 backdrop-blur-xl"
        >
          <Button type="submit" disabled={saving} className="h-11 w-full gap-2 rounded-xl">
            <Save aria-hidden="true" className="size-4" />
            {saving ? labels.saving : labels.saveChanges}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={fieldId("name")}>{labels.fullName}</Label>
          <Input id={fieldId("name")} name="name" defaultValue={name} required minLength={2} maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={fieldId("phone")}>{labels.phoneNumber}</Label>
          <Input
            id={fieldId("phone")}
            name="phone"
            type="tel"
            defaultValue={phone}
            placeholder="+92 300 0000000"
            maxLength={20}
          />
          <p className="text-muted-foreground text-xs">{labels.phoneHint}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={fieldId("city")}>{labels.city}</Label>
          <Input
            id={fieldId("city")}
            name="city"
            defaultValue={city}
            placeholder={labels.cityPlaceholder}
            maxLength={80}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={fieldId("bio")}>{labels.bio}</Label>
        <Textarea
          id={fieldId("bio")}
          name="bio"
          defaultValue={bio}
          placeholder="A short bio visible on your seller profile…"
          maxLength={300}
          rows={3}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <Button type="submit" disabled={saving}>
          <Save className="size-4" />
          {saving ? labels.saving : labels.saveChanges}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled={signingOut}
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          {signingOut ? labels.signingOut : labels.signOut}
        </Button>
      </div>
    </form>
  );
}
