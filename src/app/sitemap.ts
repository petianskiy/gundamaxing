import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.gundamaxing.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/builds`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/forum`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/lineages`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/register`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/guidelines`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${baseUrl}/terms`, changeFrequency: "monthly", priority: 0.2 },
  ];

  // Dynamic: published builds (public profiles only)
  const builds = await db.build.findMany({
    where: { user: { isProfilePrivate: false } },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });

  const buildPages: MetadataRoute.Sitemap = builds.map((build) => ({
    url: `${baseUrl}/builds/${build.slug}`,
    lastModified: build.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Dynamic: user profiles (onboarded, non-private)
  const users = await db.user.findMany({
    where: { onboardingComplete: true, isProfilePrivate: false },
    select: { username: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });

  const userPages: MetadataRoute.Sitemap = users.map((user) => ({
    url: `${baseUrl}/u/${user.username}`,
    lastModified: user.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Dynamic: forum threads
  const threads = await db.thread.findMany({
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });

  const threadPages: MetadataRoute.Sitemap = threads.map((thread) => ({
    url: `${baseUrl}/thread/${thread.id}`,
    lastModified: thread.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  // Dynamic: public lineages
  const lineages = await db.lineage.findMany({
    where: { isPublic: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });

  const lineagePages: MetadataRoute.Sitemap = lineages.map((lineage) => ({
    url: `${baseUrl}/lineages/${lineage.slug}`,
    lastModified: lineage.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...buildPages, ...userPages, ...threadPages, ...lineagePages];
}
