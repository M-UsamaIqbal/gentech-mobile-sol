"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { resetPassword } from "@/lib/auth-client";
import { ROUTES } from "@/lib/constants";
import { resetPasswordSchema, type ResetPasswordInput } from "@/features/auth/schemas";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <div className="grid gap-4 text-center">
        <p className="text-sm">
          This reset link is invalid or has expired. Please request a new one.
        </p>
        <Link
          href={ROUTES.forgotPassword}
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          Request a new link
        </Link>
      </div>
    );
  }

  async function onSubmit(values: ResetPasswordInput) {
    const { error } = await resetPassword({ newPassword: values.password, token: token! });

    if (error) {
      toast.error(error.message ?? "Could not reset your password. The link may have expired.");
      return;
    }

    toast.success("Password updated. You can now sign in.");
    router.push(ROUTES.signIn);
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
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
              <FormLabel>Confirm new password</FormLabel>
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
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Reset password
        </Button>
      </form>
    </Form>
  );
}
