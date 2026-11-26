import type { Metadata } from "next";

import { getEnabledSocialProviders } from "@/features/auth/server/enabled-providers";
import { AuthCard } from "@/features/auth/components/auth-card";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  const providers = getEnabledSocialProviders();
  return (
    <AuthCard title="Welcome back" description="Sign in to your account to continue">
      <SignInForm providers={providers} />
    </AuthCard>
  );
}
