"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, Save } from "lucide-react";
import { toast } from "sonner";

import { signOut } from "@/lib/auth-client";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileAction } from "./actions";

interface Props {
  name: string;
  bio: string;
  phone: string;
  city: string;
}

export function AccountForm({ name, bio, phone, city }: Props) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const result = await updateProfileAction(new FormData(e.currentTarget));
    setSaving(false);
    if (result.ok) {
      toast.success("Profile updated.");
    } else {
      toast.error(result.error ?? "Could not save changes.");
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
          toast.error("Could not sign out. Please try again.");
          setSigningOut(false);
        },
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" defaultValue={name} required minLength={2} maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number for WhatsApp inquiries</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={phone}
            placeholder="+92 300 0000000"
            maxLength={20}
          />
          <p className="text-muted-foreground text-xs">
            Buyers can use this number to contact you from your active listings.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            defaultValue={city}
            placeholder="e.g. Lahore"
            maxLength={80}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
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
          {saving ? "Saving…" : "Save changes"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled={signingOut}
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          {signingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </form>
  );
}
