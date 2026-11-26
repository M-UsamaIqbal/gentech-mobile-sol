"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2, MoreVertical, ShieldCheck, ShieldOff, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { USER_ROLES } from "@/lib/constants";
import { formatRelativeTime } from "@/utils/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminUserRow as AdminUserRowData } from "@/features/admin/types";
import { setUserBannedAction, setUserRoleAction } from "@/features/admin/actions/admin.actions";

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

export function AdminUserRow({ user, selfId }: { user: AdminUserRowData; selfId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const isSelf = user.id === selfId;
  const isAdmin = user.role === USER_ROLES.ADMIN;

  async function run(action: () => Promise<{ ok: boolean; error?: string }>, message: string) {
    setPending(true);
    const result = await action();
    setPending(false);
    if (!result.ok) {
      toast.error(result.error ?? "Action failed.");
      return;
    }
    toast.success(message);
    router.refresh();
  }

  return (
    <div className="flex items-start gap-3 p-3 transition-colors hover:bg-white/[0.02] sm:items-center sm:px-4">
      <Avatar className="size-9 shrink-0">
        <AvatarFallback>{initials(user.name)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-100">{user.name}</span>
          {isAdmin ? (
            <Badge variant="default" className="gap-1">
              <ShieldCheck className="size-3" />
              Admin
            </Badge>
          ) : null}
          {user.banned ? <Badge variant="destructive">Banned</Badge> : null}
          {!user.emailVerified ? (
            <Badge variant="outline" className="text-amber-600 dark:text-amber-400">
              Unverified
            </Badge>
          ) : null}
        </div>
        <p className="truncate text-xs text-slate-400">{user.email}</p>
        <p className="text-xs text-slate-500">
          {user.listingCount} listings · joined {formatRelativeTime(user.createdAt)}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label={`Actions for ${user.name}`}
              disabled={pending}
            />
          }
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MoreVertical className="size-4" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isAdmin ? (
            <DropdownMenuItem
              disabled={pending || isSelf}
              onClick={() =>
                window.confirm(`Remove administrator access from ${user.name}?`) &&
                run(
                  () => setUserRoleAction({ userId: user.id, role: USER_ROLES.USER }),
                  "Role updated to User",
                )
              }
            >
              <ShieldOff className="size-4" />
              Revoke admin
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={pending}
              onClick={() =>
                window.confirm(`Grant administrator access to ${user.name}?`) &&
                run(
                  () => setUserRoleAction({ userId: user.id, role: USER_ROLES.ADMIN }),
                  "Promoted to Admin",
                )
              }
            >
              <ShieldCheck className="size-4" />
              Make admin
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {user.banned ? (
            <DropdownMenuItem
              disabled={pending}
              onClick={() =>
                run(() => setUserBannedAction({ userId: user.id, banned: false }), "User unbanned")
              }
            >
              <UserCheck className="size-4" />
              Unban user
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              variant="destructive"
              disabled={isSelf || pending}
              onClick={() =>
                window.confirm(`Ban ${user.name} from the marketplace?`) &&
                run(() => setUserBannedAction({ userId: user.id, banned: true }), "User banned")
              }
            >
              <Ban className="size-4" />
              Ban user
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
