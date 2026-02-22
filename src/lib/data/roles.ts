import { cache } from "react";
import { db } from "@/lib/db";

export const getAllCustomRoles = cache(async () => {
  return db.customRole.findMany({
    include: {
      _count: {
        select: { users: true },
      },
    },
    orderBy: { priority: "desc" },
  });
});

export const getCustomRole = cache(async (id: string) => {
  return db.customRole.findUnique({
    where: { id },
    include: {
      users: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: { assignedAt: "desc" },
      },
    },
  });
});

export const getUserCustomRoles = cache(async (userId: string) => {
  return db.userCustomRole.findMany({
    where: { userId },
    include: {
      customRole: true,
    },
    orderBy: { assignedAt: "desc" },
  });
});

export const getUserPermissions = cache(
  async (userId: string): Promise<string[]> => {
    const userRoles = await db.userCustomRole.findMany({
      where: { userId },
      include: {
        customRole: {
          select: { permissions: true },
        },
      },
    });

    const permissions = new Set<string>();
    for (const ur of userRoles) {
      for (const perm of ur.customRole.permissions) {
        permissions.add(perm);
      }
    }

    return Array.from(permissions);
  }
);
