import type { Metadata } from "next";

import { getEnabledSocialProviders } from "@/features/auth/server/enabled-providers";
import { AuthCard } from "@/features/auth/components/auth-card";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = { 
  title: "Create account",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  const providers = getEnabledSocialProviders();
  return (
    <AuthCard title="Create your account" description="Join the marketplace in seconds">
      <SignUpForm providers={providers} />
    </AuthCard>
  );
}
