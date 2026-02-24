import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAchievementProgress, getUserLevel } from "@/lib/data/achievements";
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

  if (user.isProfilePrivate) {
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

  const [achievementProgress, levelInfo] = await Promise.all([
    getAchievementProgress(user.id),
    getUserLevel(user.id),
  ]);

  const unlockedCount = achievementProgress.filter((a) => a.isUnlocked).length;
  const totalCount = achievementProgress.length;

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <AchievementsView
          username={user.displayName || user.username}
          handle={user.username}
          achievements={achievementProgress}
          levelInfo={levelInfo}
          unlockedCount={unlockedCount}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
}
