"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Target } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import type { MonthlyMissionUI } from "@/lib/types";

function getTimeRemaining(endDate: Date) {
  const diff = Math.max(0, endDate.getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return { days, hours, minutes };
}

export function MonthlyMissionCard({ mission }: { mission: MonthlyMissionUI }) {
  const { t } = useTranslation();
  const endDate = new Date(mission.endDate);
  const [time, setTime] = useState(() => getTimeRemaining(endDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(endDate));
    }, 60_000);
    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <div className="rounded-lg border border-forum-border bg-forum-panel/90 overflow-hidden">
      <div className="h-0.5" style={{ background: "linear-gradient(to right, #d4a017, transparent)" }} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-3.5 w-3.5 text-[#d4a017]" />
          <h3 className="font-orbitron text-[10px] font-bold uppercase tracking-[0.15em] text-[#d4a017]">
            {t("forum.sidebar.monthlyMission")}
          </h3>
        </div>

        <p className="text-sm font-semibold text-gray-200 mb-1">{mission.title}</p>
        <p className="text-[11px] text-gray-500 mb-3">{mission.description}</p>

        {/* Submission count + Countdown */}
        <div className="flex items-center justify-between text-[10px] text-gray-500 font-share-tech-mono mb-3">
          <span>{mission.submissionCount} {t("forum.sidebar.submissions")}</span>
          <span>{t("forum.sidebar.timeLeft", { days: time.days, hours: time.hours, minutes: time.minutes })}</span>
        </div>

        <Link
          href="/mission"
          className="block text-center px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#d4a017]/15 text-[#d4a017] hover:bg-[#d4a017]/25 transition-colors"
        >
          {t("forum.sidebar.joinMission")}
        </Link>
      </div>
    </div>
  );
}
