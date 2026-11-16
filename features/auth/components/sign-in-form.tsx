"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { signIn } from "@/lib/auth-client";
import { ROUTES } from "@/lib/constants";
import { signInSchema, type SignInInput } from "@/features/auth/schemas";
import { SocialButtons, type EnabledSocialProviders } from "./social-buttons";
import { AuthDivider } from "./auth-divider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function SignInForm({ providers }: { providers: EnabledSocialProviders }) {
  const router = useRouter();
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  async function onSubmit(values: SignInInput) {
    const { error } = await signIn.email({
      email: values.email,
      password: values.password,
      rememberMe: values.rememberMe ?? true,
      callbackURL: ROUTES.dashboard,
    });

    if (error) {
      // 403 = email not verified — guide the user to verification.
      if (error.status === 403) {
        toast.error("Please verify your email before signing in.");
        router.push(`${ROUTES.verifyEmail}?email=${encodeURIComponent(values.email)}`);
        return;
      }
      toast.error(error.message ?? "Invalid email or password.");
      return;
    }

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
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href={ROUTES.forgotPassword}
                    className="text-muted-foreground text-sm underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Sign in
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground text-center text-sm">
        New to {""}
        <span className="font-medium">the marketplace?</span>{" "}
        <Link
          href={ROUTES.signUp}
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
