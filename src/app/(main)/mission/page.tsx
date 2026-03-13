import { auth } from "@/lib/auth";
import { getActiveMission, getMissionSubmissions, getUserMissionSubmission } from "@/lib/data/missions";
import { MissionView } from "./mission-view";
import Image from "next/image";

export default async function MissionPage() {
  const [mission, session] = await Promise.all([getActiveMission(), auth()]);

  if (!mission) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed inset-0 -z-20">
          <Image src="/images/mission-bg.jpg" alt="" fill className="object-cover object-center" priority />
        </div>
        <div className="fixed inset-0 -z-10 bg-black/70" />
        <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-orbitron text-2xl font-bold text-white uppercase tracking-wide mb-4">
            Monthly Mission
          </h1>
          <p className="font-share-tech-mono text-[12px] text-white/40 uppercase tracking-wider">
            No active mission right now — check back soon, pilot.
          </p>
        </div>
      </div>
    );
  }

  const [submissions, userSubmission] = await Promise.all([
    getMissionSubmissions(mission.id, mission.winnerId),
    session?.user?.id ? getUserMissionSubmission(mission.id, session.user.id) : Promise.resolve(null),
  ]);

  const userSub = userSubmission ? { ...userSubmission, isWinner: userSubmission.id === mission.winnerId } : null;

  return (
    <MissionView
      mission={mission}
      submissions={submissions}
      userSubmission={userSub}
      isAuthenticated={!!session?.user}
    />
  );
}
