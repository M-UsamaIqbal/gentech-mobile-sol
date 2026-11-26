import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, User as UserIcon } from "lucide-react";

import { ROUTES, USER_ROLES, type UserRole } from "@/lib/constants";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AccountForm } from "./account-form";

export const metadata: Metadata = { 
  title: "My Profile",
  robots: { index: false, follow: false },
};

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("") || "U"
  );
}

export default async function AccountPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.signIn);

  const { user } = session;
  const role = (user.role as UserRole | undefined) ?? USER_ROLES.USER;

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } }).catch(() => null);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your account details</p>
      </header>

      {/* Identity card */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <Avatar className="size-16">
            {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
            <AvatarFallback className="text-lg">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <p className="text-lg font-semibold leading-none">{user.name}</p>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant={role === USER_ROLES.ADMIN ? "default" : "secondary"}>
                {role === USER_ROLES.ADMIN ? <ShieldCheck className="size-3" /> : <UserIcon className="size-3" />}
                {role}
              </Badge>
              {user.emailVerified ? (
                <Badge variant="outline" className="text-green-600 dark:text-green-400">
                  Email verified
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 dark:text-amber-400">
                  Email not verified
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
          <CardDescription>Update your name, location, and bio.</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <AccountForm
            name={user.name}
            bio={profile?.bio ?? ""}
            phone={profile?.phone ?? ""}
            city={profile?.city ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
