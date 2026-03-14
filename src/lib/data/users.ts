import { cache } from "react";
import { db } from "@/lib/db";
import { toCdnUrl } from "@/lib/upload/r2";

export const getUserByUsername = cache(async (username: string) => {
  const user = await db.user.findUnique({
    where: { username: username.toLowerCase() },
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
    avatar: user.avatar ? toCdnUrl(user.avatar) : user.avatar,
    banner: user.banner ? toCdnUrl(user.banner) : user.banner,
    badgeCount: user._count.badges,
    buildCount: user._count.builds,
  };
});

export const getUserByEmail = cache(async (email: string) => {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user) return null;
  return {
    ...user,
    avatar: user.avatar ? toCdnUrl(user.avatar) : user.avatar,
    banner: user.banner ? toCdnUrl(user.banner) : user.banner,
  };
});

export const getUserById = cache(async (id: string) => {
  const user = await db.user.findUnique({
    where: { id },
  });
  if (!user) return null;
  return {
    ...user,
    avatar: user.avatar ? toCdnUrl(user.avatar) : user.avatar,
    banner: user.banner ? toCdnUrl(user.banner) : user.banner,
  };
});

export const getUserSettingsData = cache(async (userId: string) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatar: true,
      banner: true,
      bio: true,
      accentColor: true,
      country: true,
      skillLevel: true,
      preferredGrades: true,
      favoriteTimelines: true,
      favoriteSeries: true,
      tools: true,
      techniques: true,
      socialLinks: true,
      profileLayout: true,
      sectionOrder: true,
      pinnedBuildIds: true,
      hiddenSections: true,
      hangarTheme: true,
      hangarLayout: true,
      manifesto: true,
      domeSettings: true,
      xp: true,
      level: true,
      isProfilePrivate: true,
      passwordHash: true, // to check if user has password set
      role: true,
      verificationTier: true,
      lastUsernameChange: true,
      createdAt: true,
    },
  });
  if (!user) return null;
  return {
    ...user,
    avatar: user.avatar ? toCdnUrl(user.avatar) : user.avatar,
    banner: user.banner ? toCdnUrl(user.banner) : user.banner,
  };
});

export const getPortfolioStats = cache(async (userId: string) => {
  const [buildCount, totalLikes, totalComments, totalForks, totalBookmarks] = await Promise.all([
    db.build.count({ where: { userId } }),
    db.build.aggregate({ where: { userId }, _sum: { likeCount: true } }),
    db.build.aggregate({ where: { userId }, _sum: { commentCount: true } }),
    db.build.aggregate({ where: { userId }, _sum: { forkCount: true } }),
    db.build.aggregate({ where: { userId }, _sum: { bookmarkCount: true } }),
  ]);

  return {
    builds: buildCount,
    likes: totalLikes._sum.likeCount ?? 0,
    comments: totalComments._sum.commentCount ?? 0,
    forks: totalForks._sum.forkCount ?? 0,
    bookmarks: totalBookmarks._sum.bookmarkCount ?? 0,
  };
});
