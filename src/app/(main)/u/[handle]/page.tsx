import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Warehouse } from "lucide-react";
import { ProfileHeader } from "./components/profile-header";
import { BuildGallery } from "./components/build-gallery";
import { WorkshopSpecs } from "./components/workshop-specs";
import { Achievements } from "./components/achievements";
import { SavedBuilds } from "./components/saved-builds";
import { getBookmarkedBuilds } from "@/lib/data/bookmarks";
import { getAchievementProgress, getEarnedAchievements } from "@/lib/data/achievements";

type Props = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const user = await db.user.findUnique({
    where: { username: handle },
    select: { displayName: true, username: true, bio: true, avatar: true },
  });

  if (!user) {
    return { title: "Pilot Not Found | Gundamaxing" };
  }

  return {
    title: `${user.displayName || user.username} (@${user.username}) | Gundamaxing`,
    description: user.bio || `Check out ${user.displayName || user.username}'s Gunpla builds on Gundamaxing.`,
    openGraph: {
      title: `${user.displayName || user.username} | Gundamaxing`,
      description: user.bio || undefined,
      images: user.avatar ? [{ url: user.avatar }] : undefined,
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;

  const user = await db.user.findUnique({
    where: { username: handle },
    include: {
      _count: {
        select: {
          builds: true,
          likes: true,
        },
      },
    },
  });

  // Fetch custom roles separately — table may not exist yet if migration hasn't run
  let userCustomRoles: { customRole: { displayName: string; color: string; icon: string | null } }[] = [];
  if (user) {
    try {
      userCustomRoles = await db.userCustomRole.findMany({
        where: { userId: user.id },
        include: { customRole: { select: { displayName: true, color: true, icon: true } } },
        orderBy: { customRole: { priority: "asc" } },
      });
    } catch {
      // Table doesn't exist yet
    }
  }

  if (!user) {
    return (
      <div className="pt-24 pb-16 px-4 text-center">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold text-foreground">
            Pilot Not Found
          </h1>
          <p className="mt-2 text-muted-foreground">
            No pilot with the username @{handle} exists in our registry.
          </p>
          <a
            href="/builds"
            className="mt-4 inline-block text-sm text-gx-red hover:text-red-400 transition-colors"
          >
            Browse builds instead
          </a>
        </div>
      </div>
    );
  }

  const builds = await db.build.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      images: true,
      user: { select: { username: true, avatar: true } },
    },
  });

  const session = await auth();
  const isOwner = session?.user?.id === user.id;
  const bookmarkedBuilds = isOwner ? await getBookmarkedBuilds(user.id) : [];
  const achievementData = isOwner
    ? await getAchievementProgress(user.id)
    : await getEarnedAchievements(user.id);

  // Privacy check: if profile is private and viewer is not the owner, show limited view
  if (user.isProfilePrivate && !isOwner) {
    return (
      <div className="pt-24 pb-16 px-4 text-center">
        <div className="mx-auto max-w-md">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            @{user.username}
          </h1>
          <p className="mt-2 text-muted-foreground">
            This pilot&apos;s profile is private.
          </p>
          <a
            href="/builds"
            className="mt-4 inline-block text-sm text-gx-red hover:text-red-400 transition-colors"
          >
            Browse builds instead
          </a>
        </div>
      </div>
    );
  }

  const sectionOrder = user.sectionOrder.length > 0
    ? user.sectionOrder
    : ["featured", "gallery", "wip", "workshop", "achievements"];
  const hiddenSections = new Set(user.hiddenSections);

  const featuredBuild = builds.find((b) => b.isFeaturedBuild) || null;
  const socialLinks = (user.socialLinks as Record<string, string> | null) || {};

  const sectionComponents: Record<string, React.ReactNode> = {
    featured: featuredBuild && !hiddenSections.has("featured") ? (
      <section key="featured" className="rounded-xl border border-border/50 bg-card p-5">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
          Featured Build
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          {featuredBuild.images[0] && (
            <div className="relative w-full sm:w-48 aspect-[4/3] rounded-lg overflow-hidden bg-muted shrink-0">
              <img
                src={featuredBuild.images[0].url}
                alt={featuredBuild.images[0].alt}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {featuredBuild.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {featuredBuild.kitName} &middot; {featuredBuild.grade} &middot;{" "}
              {featuredBuild.scale}
            </p>
            {featuredBuild.intentStatement && (
              <p className="text-sm text-zinc-300 mt-2 leading-relaxed">
                {featuredBuild.intentStatement}
              </p>
            )}
          </div>
        </div>
      </section>
    ) : null,
    gallery: !hiddenSections.has("gallery") ? (
      <BuildGallery key="gallery" builds={builds} userHandle={user.username} />
    ) : null,
    workshop: !hiddenSections.has("workshop") ? (
      <WorkshopSpecs
        key="workshop"
        skillLevel={user.skillLevel}
        techniques={user.techniques}
        tools={user.tools}
        preferredGrades={user.preferredGrades}
      />
    ) : null,
    achievements: (() => {
      if (hiddenSections.has("achievements")) return null;
      if (!isOwner && achievementData.length === 0) return null;
      return (
        <Achievements
          key="achievements"
          achievements={achievementData}
          isOwner={isOwner}
          handle={user.username}
        />
      );
    })(),
    saved: isOwner ? (
      <SavedBuilds key="saved" builds={bookmarkedBuilds} />
    ) : null,
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Hangar banner */}
        <Link
          href={`/hangar/${handle}`}
          className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-sm text-blue-400 transition-colors hover:bg-blue-500/20"
        >
          <Warehouse className="h-4 w-4 shrink-0" />
          <span>Visit this builder&apos;s Hangar</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>

        <ProfileHeader
          user={{
            displayName: user.displayName,
            username: user.username,
            avatar: user.avatar,
            banner: user.banner,
            bio: user.bio,
            accentColor: user.accentColor,
            verificationTier: user.verificationTier,
            role: user.role,
            customRoles: userCustomRoles.map((ucr) => ({
              displayName: ucr.customRole.displayName,
              color: ucr.customRole.color,
              icon: ucr.customRole.icon,
            })),
            level: user.level,
            reputation: user.reputation,
            socialLinks,
            buildCount: user._count.builds,
            likeCount: user._count.likes,
            joinedAt: user.createdAt.toLocaleDateString(),
            isBanned: user.riskScore >= 100,
          }}
          isOwner={isOwner}
        />

        {sectionOrder.map((section) => sectionComponents[section])}
      </div>
    </div>
  );
}
