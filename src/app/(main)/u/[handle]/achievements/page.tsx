import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAchievementProgress,
  getEarnedAchievements,
  getUserLevel,
} from "@/lib/data/achievements";
import { AchievementsView } from "./achievements-view";

type Props = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const user = await db.user.findUnique({
    where: { username: handle },
    select: { displayName: true, username: true },
  });

  if (!user) {
    return { title: "Pilot Not Found | Gundamaxing" };
  }

  return {
    title: `${user.displayName || user.username}'s Achievements | Gundamaxing`,
    description: `View ${user.displayName || user.username}'s achievements and level progress on Gundamaxing.`,
  };
}

export default async function AchievementsPage({ params }: Props) {
  const { handle } = await params;

  const user = await db.user.findUnique({
    where: { username: handle },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      xp: true,
      level: true,
      isProfilePrivate: true,
    },
  });

  if (!user) notFound();

  const session = await auth();
  const isOwner = session?.user?.id === user.id;

  if (user.isProfilePrivate && !isOwner) {
    return (
      <div className="pt-24 pb-16 px-4 text-center">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold text-foreground">Private Profile</h1>
          <p className="mt-2 text-muted-foreground">
            This pilot&apos;s achievements are private.
          </p>
        </div>
      </div>
    );
  }

  const [achievements, levelInfo] = await Promise.all([
    isOwner
      ? getAchievementProgress(user.id)
      : getEarnedAchievements(user.id),
    getUserLevel(user.id),
  ]);

  // Visitor with no earned achievements
  if (!isOwner && achievements.length === 0) {
    return (
      <div className="pt-24 pb-16 px-4 text-center">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold text-foreground">
            {user.displayName || user.username}&apos;s Achievements
          </h1>
          <p className="mt-2 text-muted-foreground">
            This pilot hasn&apos;t earned any achievements yet.
          </p>
        </div>
      </div>
    );
  }

  const totalCount = isOwner ? achievements.length : undefined;
  const earnedCount = achievements.filter((a) => a.tier >= 1).length;

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <AchievementsView
          username={user.displayName || user.username}
          handle={user.username}
          achievements={achievements}
          levelInfo={levelInfo}
          earnedCount={earnedCount}
          totalCount={totalCount}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
