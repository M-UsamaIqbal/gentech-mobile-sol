import "server-only";

import { USER_ROLES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

/**
 * Returns the current user only if they can perform inspections — an INSPECTOR or
 * an ADMIN (admins can act on any request). The single authority for inspector
 * authorization: used by the `/inspector` layout (to redirect) and every inspector
 * server action (to refuse).
 */
export async function requireInspector() {
  const user = await getCurrentUser();
  if (!user) return null;
  const role = (user.role as string | undefined) ?? USER_ROLES.USER;
  return role === USER_ROLES.INSPECTOR || role === USER_ROLES.ADMIN ? user : null;
}
