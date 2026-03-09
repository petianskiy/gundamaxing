"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Target } from "lucide-react";

const MISSION = {
  title: "Weathering Challenge",
  description: "Build and weather any kit using at least 3 different techniques. Show your process!",
  progress: 47,
  total: 100,
  endDate: new Date("2026-03-31T23:59:59"),
};

function getTimeRemaining(endDate: Date) {
  const diff = Math.max(0, endDate.getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return { days, hours, minutes };
}

export function MonthlyMissionCard() {
  const [time, setTime] = useState(() => getTimeRemaining(MISSION.endDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(MISSION.endDate));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const progressPercent = Math.round((MISSION.progress / MISSION.total) * 100);

  return (
    <div className="rounded-lg border border-forum-border bg-forum-panel/90 overflow-hidden">
      <div className="h-0.5" style={{ background: "linear-gradient(to right, #d4a017, transparent)" }} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-3.5 w-3.5 text-[#d4a017]" />
          <h3 className="font-orbitron text-[10px] font-bold uppercase tracking-[0.15em] text-[#d4a017]">
            Monthly Mission
          </h3>
        </div>

        <p className="text-sm font-semibold text-gray-200 mb-1">{MISSION.title}</p>
        <p className="text-[11px] text-gray-500 mb-3">{MISSION.description}</p>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
            <span>{MISSION.progress} submissions</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-forum-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progressPercent}%`,
                background: "linear-gradient(to right, #d4a017, #f5c842)",
              }}
            />
          </div>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-share-tech-mono mb-3">
          <span>{time.days}d {time.hours}h {time.minutes}m remaining</span>
        </div>

        <Link
          href="/upload"
          className="block text-center px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#d4a017]/15 text-[#d4a017] hover:bg-[#d4a017]/25 transition-colors"
        >
          Submit Build
        </Link>
      </div>
    </div>
  );
}
