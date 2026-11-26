import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { assignInitialAdminIfNeeded } from "@/features/auth/repositories/initial-role.repository";
import { APP_URL, IS_VERCEL_DEPLOYMENT } from "@/lib/app-url";
import { APP, USER_ROLES } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
// Better Auth owns its tables, so it is the one infrastructure module besides
// repositories that may import the Prisma client directly.
import { prisma } from "@/lib/prisma";

/**
 * Conditionally enable social providers — only when their credentials exist.
 * This lets the app boot and run email/password auth before OAuth is configured.
 */
function buildSocialProviders(): BetterAuthOptions["socialProviders"] {
  const providers: NonNullable<BetterAuthOptions["socialProviders"]> = {};

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }
  if (env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) {
    providers.facebook = {
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET,
    };
  }
  return providers;
}

export const auth = betterAuth({
  appName: APP.name,
  baseURL: IS_VERCEL_DEPLOYMENT ? APP_URL : (env.BETTER_AUTH_URL ?? APP_URL),
  secret: env.BETTER_AUTH_SECRET,

  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: `Reset your ${APP.name} password`,
        text: `Hi ${user.name || "there"},\n\nReset your password using the link below (valid for 1 hour):\n${url}\n\nIf you didn't request this, you can safely ignore this email.`,
      });
    },
  },

  socialProviders: buildSocialProviders(),

  user: {
    additionalFields: {
      // Authorization role. `input: false` prevents clients from self-assigning a role.
      role: {
        type: "string",
        required: false,
        defaultValue: USER_ROLES.USER,
        input: false,
      },
      // Region selection — user chooses Bahrain or Pakistan during sign-up.
      // Stored in the User table for data isolation.
      region: {
        type: "string",
        required: false,
        defaultValue: "PAKISTAN",
        input: true,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once per day
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({ data: { ...user, emailVerified: true } }),
        after: async (user) => {
          // Promote the first persisted account only; the lock in the repository
          // makes concurrent sign-ups safe.
          await assignInitialAdminIfNeeded(user.id);

          // Provision an (empty) profile row alongside every new account.
          // Pass the user's chosen region to the profile.
          await prisma.profile.create({
            data: {
              userId: user.id,
              region: (user.region as "BAHRAIN" | "PAKISTAN") ?? "PAKISTAN",
            },
          });
        },
      },
    },
  },

  // Keep `nextCookies()` LAST so Set-Cookie headers are applied to server actions.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
