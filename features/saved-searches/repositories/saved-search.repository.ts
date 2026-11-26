import "server-only";

import { prisma } from "@/lib/prisma";

export interface SavedSearchItem {
  id: string;
  name: string;
  query: string;
  createdAt: string;
  alertsEnabled: boolean;
}

export interface SavedSearchAlertCandidate {
  id: string;
  userId: string;
  name: string;
  query: string;
}

export async function listSavedSearches(userId: string): Promise<SavedSearchItem[]> {
  const rows = await prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, query: true, createdAt: true, alertsEnabled: true },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name ?? "All listings",
    query: row.query ?? "",
    createdAt: row.createdAt.toISOString(),
    alertsEnabled: row.alertsEnabled,
  }));
}

export async function listSavedSearchAlertCandidates(): Promise<SavedSearchAlertCandidate[]> {
  const rows = await prisma.savedSearch.findMany({
    where: { alertsEnabled: true, query: { not: null } },
    select: { id: true, userId: true, name: true, query: true },
  });
  return rows.flatMap((row) =>
    row.query
      ? [{ id: row.id, userId: row.userId, name: row.name ?? "Saved search", query: row.query }]
      : [],
  );
}

export async function createSavedSearch(
  userId: string,
  data: { query: string; name: string },
): Promise<SavedSearchItem> {
  // Avoid duplicates of the exact same query for a user.
  const existing = await prisma.savedSearch.findFirst({
    where: { userId, query: data.query },
    select: { id: true },
  });

  const row = existing
    ? await prisma.savedSearch.update({
        where: { id: existing.id },
        data: { name: data.name },
        select: { id: true, name: true, query: true, createdAt: true, alertsEnabled: true },
      })
    : await prisma.savedSearch.create({
        data: { userId, query: data.query, name: data.name, alertsEnabled: true },
        select: { id: true, name: true, query: true, createdAt: true, alertsEnabled: true },
      });

  return {
    id: row.id,
    name: row.name ?? "All listings",
    query: row.query ?? "",
    createdAt: row.createdAt.toISOString(),
    alertsEnabled: row.alertsEnabled,
  };
}

export async function updateSavedSearchAlerts(
  userId: string,
  id: string,
  enabled: boolean,
): Promise<boolean> {
  const result = await prisma.savedSearch.updateMany({
    where: { id, userId },
    data: { alertsEnabled: enabled },
  });
  return result.count > 0;
}

/** Deletes a saved search, scoped to its owner. */
export async function deleteSavedSearch(userId: string, id: string): Promise<boolean> {
  const result = await prisma.savedSearch.deleteMany({ where: { id, userId } });
  return result.count > 0;
}
