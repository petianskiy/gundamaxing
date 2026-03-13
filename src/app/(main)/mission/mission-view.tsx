"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Target, Trophy, Edit3, Send, Users, ImageIcon, Film, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import type { MonthlyMissionUI, MissionSubmissionUI } from "@/lib/types";
import { MissionSubmitForm } from "./mission-submit-form";

function getTimeRemaining(endDate: Date) {
  const diff = Math.max(0, endDate.getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, expired: diff === 0 };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-orbitron text-2xl sm:text-3xl font-bold text-white tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="font-share-tech-mono text-[8px] uppercase tracking-[0.2em] text-white/30 mt-1">
        {label}
      </span>
    </div>
  );
}

export function MissionView({
  mission,
  submissions,
  userSubmission,
  isAuthenticated,
}: {
  mission: MonthlyMissionUI;
  submissions: MissionSubmissionUI[];
  userSubmission: MissionSubmissionUI | null;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const endDate = new Date(mission.endDate);
  const [time, setTime] = useState(() => getTimeRemaining(endDate));
  const [showForm, setShowForm] = useState(false);

  const missionEnded = time.expired;

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(endDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    router.refresh();
  }, [router]);

  const winnerSubmission = mission.winnerId
    ? submissions.find((s) => s.id === mission.winnerId)
    : null;

  return (
    <div className="relative min-h-screen">
      {/* Cinematic background */}
      <div className="fixed inset-0 -z-20">
        <Image
          src="/images/mission-bg.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-black/65" />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">

          {/* ═══ MISSION CARD ═══ */}
          <div className="relative mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-[#d4a017]/60 to-transparent" />
              <span className="font-share-tech-mono text-[9px] font-bold uppercase tracking-[0.3em] text-[#d4a017]/70">
                Monthly Mission
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-[#d4a017]/60 to-transparent" />
            </div>

            <div className="relative bg-black/40 backdrop-blur-sm border border-white/[0.08]">
              <div className="absolute top-0 left-0 w-20 h-[3px] bg-gradient-to-r from-[#d4a017] to-[#d4a017]/0" />

              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-[#d4a017] shrink-0" />
                    <h1 className="font-orbitron text-xl sm:text-2xl font-bold text-white uppercase tracking-wide">
                      {mission.title}
                    </h1>
                  </div>
                  {!missionEnded && isAuthenticated && !userSubmission && (
                    <button
                      type="button"
                      onClick={() => setShowForm(!showForm)}
                      className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#d4a017]/15 border border-[#d4a017]/30 text-[#d4a017] font-orbitron text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-[#d4a017]/25 hover:border-[#d4a017]/50 transition-all"
                    >
                      <Send className="h-3 w-3" />
                      Submit Build
                    </button>
                  )}
                </div>

                <p className="text-[13px] text-white/50 leading-relaxed mb-8 max-w-2xl">
                  {mission.description}
                </p>

                {/* Countdown + stats */}
                <div className="flex flex-wrap items-end gap-8">
                  {missionEnded ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20">
                      <span className="font-orbitron text-sm font-bold text-red-400/80 uppercase tracking-wider">
                        Mission Complete
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="block font-share-tech-mono text-[9px] uppercase tracking-[0.2em] text-white/30 mb-3">
                        Time Remaining
                      </span>
                      <div className="flex items-center gap-4">
                        <CountdownUnit value={time.days} label="Days" />
                        <span className="text-white/15 font-orbitron text-lg mb-4">:</span>
                        <CountdownUnit value={time.hours} label="Hours" />
                        <span className="text-white/15 font-orbitron text-lg mb-4">:</span>
                        <CountdownUnit value={time.minutes} label="Min" />
                        <span className="text-white/15 font-orbitron text-lg mb-4">:</span>
                        <CountdownUnit value={time.seconds} label="Sec" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-6 mb-1">
                    <div>
                      <span className="block font-orbitron text-2xl font-bold text-white">
                        {mission.submissionCount}
                      </span>
                      <span className="font-share-tech-mono text-[8px] uppercase tracking-[0.2em] text-white/30">
                        Entries
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ RULES + PRIZES ═══ */}
          {(mission.rules || mission.prizes) && (
            <div className={`grid gap-[2px] mb-12 ${
              mission.rules && mission.prizes ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 max-w-3xl mx-auto"
            }`}>
              {mission.rules && (
                <div className="relative bg-black/40 backdrop-blur-sm border border-white/[0.08] p-6 sm:p-8">
                  <div className="absolute top-0 left-0 w-12 h-[2px] bg-[#d4a017]" />
                  <h3 className="font-orbitron text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4a017] mb-4">
                    Rules & Criteria
                  </h3>
                  <div className="text-[13px] text-white/50 leading-[1.8] whitespace-pre-line">
                    {mission.rules}
                  </div>
                </div>
              )}

              {mission.prizes && (
                <div className="relative bg-black/40 backdrop-blur-sm border border-white/[0.08] p-6 sm:p-8">
                  <div className="absolute top-0 left-0 w-12 h-[2px] bg-[#d4a017]" />
                  <h3 className="font-orbitron text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4a017] mb-4">
                    Prizes
                  </h3>
                  <div className="text-[13px] text-white/50 leading-[1.8] whitespace-pre-line">
                    {mission.prizes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ WINNER ═══ */}
          {winnerSubmission && missionEnded && (
            <div className="relative mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-[#d4a017]/50 to-transparent" />
                <Trophy className="h-4 w-4 text-[#d4a017]" />
                <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.3em] text-[#d4a017]">
                  Grand Prize Winner
                </span>
                <Trophy className="h-4 w-4 text-[#d4a017]" />
                <div className="h-px flex-1 bg-gradient-to-l from-[#d4a017]/50 to-transparent" />
              </div>

              <div className="relative bg-black/40 backdrop-blur-sm border-2 border-[#d4a017]/30 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#d4a017] via-[#d4a017]/50 to-[#d4a017]" />
                <div className="flex flex-col sm:flex-row">
                  {winnerSubmission.images[0] && (
                    <div className="relative w-full sm:w-80 h-52 sm:h-auto shrink-0">
                      <Image
                        src={winnerSubmission.images[0]}
                        alt={winnerSubmission.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40 hidden sm:block" />
                    </div>
                  )}
                  <div className="p-6 sm:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="h-4 w-4 text-[#d4a017]" />
                      <span className="font-share-tech-mono text-[9px] uppercase tracking-[0.2em] text-[#d4a017]">
                        Winner
                      </span>
                    </div>
                    <h3 className="font-orbitron text-lg font-bold text-white uppercase tracking-wide mb-2">
                      {winnerSubmission.title}
                    </h3>
                    <p className="text-[13px] text-white/45 line-clamp-3 mb-4 leading-relaxed">
                      {winnerSubmission.description}
                    </p>
                    <div className="flex items-center gap-2">
                      {winnerSubmission.userAvatar && (
                        <Image
                          src={winnerSubmission.userAvatar}
                          alt={winnerSubmission.username}
                          width={22}
                          height={22}
                          className="rounded-full border border-[#d4a017]/30"
                        />
                      )}
                      <span className="font-share-tech-mono text-[10px] text-[#d4a017]/80 uppercase tracking-wider">
                        {winnerSubmission.username}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ USER STATUS ═══ */}
          <div className="mb-12">
            {!isAuthenticated ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <p className="font-share-tech-mono text-[11px] text-white/35 uppercase tracking-wider">
                  Sign in to participate in this mission
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#d4a017]/15 border border-[#d4a017]/30 text-[#d4a017] font-orbitron text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-[#d4a017]/25 transition-all"
                >
                  Sign In to Enter
                </Link>
              </div>
            ) : userSubmission ? (
              <div className="relative bg-black/40 backdrop-blur-sm border border-white/[0.08] overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-green-500/60 via-green-500/20 to-transparent" />
                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="font-share-tech-mono text-[10px] uppercase tracking-[0.2em] text-green-400/70">
                        Your Submission
                      </span>
                      {userSubmission.isWinner && (
                        <span className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-[#d4a017]/20 border border-[#d4a017]/30">
                          <Trophy className="h-3 w-3 text-[#d4a017]" />
                          <span className="font-share-tech-mono text-[9px] text-[#d4a017] uppercase tracking-wider">Winner</span>
                        </span>
                      )}
                    </div>
                    {!missionEnded && (
                      <button
                        type="button"
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.08] text-white/60 font-share-tech-mono text-[10px] uppercase tracking-wider hover:bg-white/[0.08] hover:text-white transition-all"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit Submission
                      </button>
                    )}
                  </div>

                  <div className="flex gap-5">
                    {userSubmission.images[0] && (
                      <div className="relative w-28 h-28 shrink-0 overflow-hidden border border-white/[0.06]">
                        <Image src={userSubmission.images[0]} alt="" fill className="object-cover" />
                        {userSubmission.images.length > 1 && (
                          <div className="absolute bottom-0 right-0 bg-black/70 px-1.5 py-0.5">
                            <span className="font-share-tech-mono text-[8px] text-white/60">
                              +{userSubmission.images.length - 1}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 py-1">
                      <h3 className="font-orbitron text-[13px] font-bold text-white uppercase tracking-wide mb-1.5 truncate">
                        {userSubmission.title}
                      </h3>
                      <p className="text-[12px] text-white/35 line-clamp-2 mb-3 leading-relaxed">
                        {userSubmission.description}
                      </p>
                      <div className="flex items-center gap-4 font-share-tech-mono text-[9px] text-white/20 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          {userSubmission.images.length}
                        </span>
                        {userSubmission.videoUrl && (
                          <span className="flex items-center gap-1">
                            <Film className="h-3 w-3" />
                            1
                          </span>
                        )}
                        <span>
                          Updated {new Date(userSubmission.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : !missionEnded ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <p className="font-share-tech-mono text-[11px] text-white/30 uppercase tracking-wider">
                  You haven&apos;t submitted an entry yet
                </p>
                <button
                  type="button"
                  onClick={() => setShowForm(!showForm)}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#d4a017]/15 border border-[#d4a017]/30 text-[#d4a017] font-orbitron text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-[#d4a017]/25 hover:border-[#d4a017]/50 transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                  Submit Your Entry
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="font-share-tech-mono text-[11px] text-white/25 uppercase tracking-wider">
                  This mission has ended — submissions are closed
                </p>
              </div>
            )}
          </div>

          {/* ═══ INLINE FORM ═══ */}
          {showForm && !missionEnded && isAuthenticated && (
            <div className="mb-12">
              <div className="relative bg-black/40 backdrop-blur-sm border border-white/[0.08] max-w-3xl mx-auto">
                <div className="absolute top-0 left-0 w-16 h-[3px] bg-gradient-to-r from-[#d4a017] to-[#d4a017]/0" />
                <div className="p-6 sm:p-8">
                  <MissionSubmitForm
                    existingSubmission={userSubmission}
                    onSuccess={handleFormSuccess}
                    onCancel={() => setShowForm(false)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═══ SUBMISSIONS GALLERY ═══ */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            <span className="font-share-tech-mono text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">
              {submissions.length} Submissions
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-share-tech-mono text-[11px] uppercase tracking-wider text-white/30">
                No submissions yet — be the first pilot to enter
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[2px] bg-white/[0.03]">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className={`group relative bg-black/40 backdrop-blur-sm overflow-hidden ${
                    sub.isWinner ? "ring-1 ring-[#d4a017]/40" : ""
                  }`}
                >
                  {sub.images[0] ? (
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={sub.images[0]}
                        alt={sub.title}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-white/[0.03]" />
                  )}

                  {sub.isWinner && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-[#d4a017]/90">
                      <Trophy className="h-3 w-3 text-black" />
                      <span className="font-orbitron text-[8px] font-bold text-black uppercase tracking-wider">
                        Winner
                      </span>
                    </div>
                  )}

                  {sub.images.length > 1 && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm">
                      <span className="font-share-tech-mono text-[9px] text-white/60">
                        {sub.images.length} imgs
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-orbitron text-[11px] font-bold text-white uppercase tracking-wide mb-1">
                      {sub.title}
                    </h3>
                    <p className="text-[10px] text-white/40 line-clamp-1 mb-2">
                      {sub.description}
                    </p>
                    <div className="flex items-center gap-2">
                      {sub.userAvatar && (
                        <Image
                          src={sub.userAvatar}
                          alt={sub.username}
                          width={16}
                          height={16}
                          className="rounded-full border border-white/10"
                        />
                      )}
                      <span className="font-share-tech-mono text-[9px] text-white/40 uppercase tracking-wider">
                        {sub.username}
                      </span>
                    </div>
                  </div>

                  <div className="absolute inset-0 border border-transparent group-hover:border-white/20 transition-colors duration-300 pointer-events-none" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
