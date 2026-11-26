import "server-only";

import { prisma } from "@/lib/prisma";

export async function getActiveLocationTree(countryCode?: string) {
  return prisma.country.findMany({
    where: {
      isActive: true,
      ...(countryCode ? { code: countryCode } : {}),
    },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      code: true,
      cities: {
        where: { isActive: true },
        orderBy: [{ position: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          areas: {
            where: { isActive: true },
            orderBy: [{ position: "asc" }, { name: "asc" }],
            select: { id: true, name: true },
          },
        },
      },
    },
  });
}
