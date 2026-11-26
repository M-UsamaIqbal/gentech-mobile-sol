"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { authClient, signUp } from "@/lib/auth-client";
import { ROUTES } from "@/lib/constants";
import { signUpSchema, type SignUpInput } from "@/features/auth/schemas";
import { SocialButtons, type EnabledSocialProviders } from "./social-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AuthDivider } from "./auth-divider";

export function SignUpForm({ providers }: { providers: EnabledSocialProviders }) {
  const router = useRouter();
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", region: "PAKISTAN" },
  });

  async function onSubmit(values: SignUpInput) {
    const { error } = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      region: values.region,
      callbackURL: ROUTES.dashboard,
    });

    if (error) {
      toast.error(error.message ?? "Could not create your account.");
      return;
    }

    // The first account is promoted to ADMIN by a post-create database hook,
    // after the sign-up response is built. Refresh from the database so the
    // session cookie cache carries the persisted role instead of USER.
    try {
      await authClient.getSession({ query: { disableCookieCache: true } });
    } catch {
      // Non-fatal: the cache refreshes itself within its 5-minute window.
    }

    toast.success("Account created. Welcome to GenTech!");
    router.push(ROUTES.dashboard);
    router.refresh();
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="grid gap-6">
      <SocialButtons providers={providers} />
      {(providers.google || providers.facebook) && <AuthDivider />}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" placeholder="Ali Khan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Region</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="PAKISTAN">Pakistan</option>
                    <option value="BAHRAIN">Bahrain</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Create account
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link
          href={ROUTES.signIn}
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
