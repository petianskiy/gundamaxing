import { cache } from "react";
import { db } from "@/lib/db";
import type { MonthlyMissionUI, MissionSubmissionUI, AdminMissionSubmissionUI } from "@/lib/types";

export const getActiveMission = cache(async (): Promise<MonthlyMissionUI | null> => {
  const mission = await db.monthlyMission.findFirst({
    where: { isActive: true },
    include: {
      _count: { select: { submissions: true } },
      winner: {
        include: { user: { select: { username: true } } },
      },
    },
  });

  if (!mission) return null;

  return {
    id: mission.id,
    title: mission.title,
    description: mission.description,
    rules: mission.rules,
    prizes: mission.prizes,
    startDate: mission.startDate.toISOString(),
    endDate: mission.endDate.toISOString(),
    isActive: mission.isActive,
    submissionCount: mission._count.submissions,
    winnerId: mission.winnerId,
    winnerUsername: mission.winner?.user.username ?? null,
    winnerSubmissionTitle: mission.winner?.title ?? null,
  };
});

export const getMissionSubmissions = cache(
  async (missionId: string, winnerId: string | null): Promise<MissionSubmissionUI[]> => {
    const submissions = await db.missionSubmission.findMany({
      where: { missionId },
      include: {
        user: { select: { username: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return submissions.map((s) => ({
      id: s.id,
      missionId: s.missionId,
      userId: s.userId,
      username: s.user.username,
      userAvatar: s.user.avatar,
      title: s.title,
      description: s.description,
      images: s.images,
      videoUrl: s.videoUrl,
      isWinner: s.id === winnerId,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  },
);

export const getUserMissionSubmission = cache(
  async (missionId: string, userId: string): Promise<MissionSubmissionUI | null> => {
    const sub = await db.missionSubmission.findUnique({
      where: { missionId_userId: { missionId, userId } },
      include: { user: { select: { username: true, avatar: true } } },
    });

    if (!sub) return null;

    return {
      id: sub.id,
      missionId: sub.missionId,
      userId: sub.userId,
      username: sub.user.username,
      userAvatar: sub.user.avatar,
      title: sub.title,
      description: sub.description,
      images: sub.images,
      videoUrl: sub.videoUrl,
      isWinner: false, // caller corrects from mission.winnerId
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
    };
  },
);

export const getAdminMission = cache(async () => {
  return db.monthlyMission.findFirst({
    where: { isActive: true },
    include: {
      _count: { select: { submissions: true } },
      winner: {
        include: { user: { select: { username: true } } },
      },
    },
  });
});

export const getAdminMissionSubmissions = cache(
  async (missionId: string): Promise<AdminMissionSubmissionUI[]> => {
    const mission = await db.monthlyMission.findUnique({
      where: { id: missionId },
      select: { winnerId: true },
    });

    const submissions = await db.missionSubmission.findMany({
      where: { missionId },
      include: {
        user: { select: { username: true, avatar: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return submissions.map((s) => ({
      id: s.id,
      userId: s.userId,
      username: s.user.username,
      userAvatar: s.user.avatar,
      userEmail: s.user.email,
      title: s.title,
      description: s.description,
      images: s.images,
      videoUrl: s.videoUrl,
      isWinner: s.id === mission?.winnerId,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  },
);
