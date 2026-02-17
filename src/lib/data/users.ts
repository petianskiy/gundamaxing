import { cache } from "react";
import { db } from "@/lib/db";

export const getUserByHandle = cache(async (handle: string) => {
  const user = await db.user.findUnique({
    where: { handle: handle.toLowerCase() },
    include: {
      _count: {
        select: {
          badges: true,
          builds: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    ...user,
    badgeCount: user._count.badges,
    buildCount: user._count.builds,
  };
});

export const getUserByEmail = cache(async (email: string) => {
  return db.user.findUnique({
    where: { email: email.toLowerCase() },
  });
});

export const getUserById = cache(async (id: string) => {
  return db.user.findUnique({
    where: { id },
  });
});
