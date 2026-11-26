/**
 * Idempotent seed for a real credential-backed administrator account.
 *
 * Credentials are supplied through the environment so no password is committed:
 *   SEED_ADMIN_EMAIL=user@example.com SEED_ADMIN_PASSWORD=... pnpm db:seed:admin
 */
import { hashPassword } from "better-auth/crypto";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../lib/generated/prisma/client";
import { Role } from "../lib/generated/prisma/enums";

try {
  process.loadEnvFile();
} catch {
  // Ambient environment is already configured (Vercel/CI).
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set to seed an admin.");
  }

  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL (or DIRECT_URL) must be set to seed the database.");
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: "GenTech Demo Admin",
        emailVerified: true,
        role: Role.ADMIN,
        region: "BAHRAIN",
        banned: false,
        deletedAt: null,
      },
      create: {
        name: "GenTech Demo Admin",
        email,
        emailVerified: true,
        role: Role.ADMIN,
        region: "BAHRAIN",
      },
    });

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: { region: "BAHRAIN" },
      create: { userId: user.id, region: "BAHRAIN" },
    });

    await prisma.account.upsert({
      where: {
        providerId_accountId: { providerId: "credential", accountId: user.id },
      },
      update: { password: passwordHash },
      create: {
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: passwordHash,
      },
    });

    console.info(`✓ Seeded admin ${email} with credential sign-in.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
