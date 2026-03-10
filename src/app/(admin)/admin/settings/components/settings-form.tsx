"use client";

import { useTransition, useState } from "react";
import { updateSetting, addProfanityWord, removeProfanityWord, createOrUpdateMission } from "@/lib/actions/admin-settings";
import { X } from "lucide-react";
import Link from "next/link";

interface MissionData {
  id: string;
  title: string;
  description: string;
  rules: string | null;
  prizes: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  submissionCount: number;
}

interface SettingsFormProps {
  initialSettings: Record<string, string>;
  mission: MissionData | null;
}

function SuccessFlash({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="text-xs text-green-400 font-medium ml-2 animate-pulse">
      Saved
    </span>
  );
}

export function SettingsForm({ initialSettings, mission }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [flash, setFlash] = useState<string | null>(null);
  const [newWord, setNewWord] = useState("");
  const [words, setWords] = useState<string[]>(() => {
    try {
      return JSON.parse(initialSettings.profanity_custom_words ?? "[]");
    } catch {
      return [];
    }
  });

  // Mission state
  const [mTitle, setMTitle] = useState(mission?.title ?? "");
  const [mDesc, setMDesc] = useState(mission?.description ?? "");
  const [mRules, setMRules] = useState(mission?.rules ?? "");
  const [mPrizes, setMPrizes] = useState(mission?.prizes ?? "");
  const [mStart, setMStart] = useState(mission?.startDate ?? "");
  const [mEnd, setMEnd] = useState(mission?.endDate ?? "");
  const [mActive, setMActive] = useState(mission?.isActive ?? false);

  const showFlash = (key: string) => {
    setFlash(key);
    setTimeout(() => setFlash(null), 2000);
  };

  const handleToggle = (key: string, currentValue: string) => {
    const newValue = currentValue === "true" ? "false" : "true";
    startTransition(async () => {
      const result = await updateSetting(key, newValue);
      if (result.success) showFlash(key);
    });
  };

  const handleNumberChange = (key: string, value: string) => {
    startTransition(async () => {
      const result = await updateSetting(key, value);
      if (result.success) showFlash(key);
    });
  };

  const handleAddWord = () => {
    const trimmed = newWord.trim().toLowerCase();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await addProfanityWord(trimmed);
      if (result.success) {
        setWords((prev) => [...prev, trimmed]);
        setNewWord("");
        showFlash("profanity_custom_words");
      }
    });
  };

  const handleRemoveWord = (word: string) => {
    startTransition(async () => {
      const result = await removeProfanityWord(word);
      if (result.success) {
        setWords((prev) => prev.filter((w) => w !== word));
        showFlash("profanity_custom_words");
      }
    });
  };

  const handleSaveMission = () => {
    const formData = new FormData();
    if (mission?.id) formData.set("missionId", mission.id);
    formData.set("missionTitle", mTitle);
    formData.set("missionDescription", mDesc);
    formData.set("missionRules", mRules);
    formData.set("missionPrizes", mPrizes);
    formData.set("missionStartDate", mStart);
    formData.set("missionEndDate", mEnd);
    formData.set("missionActive", mActive ? "true" : "false");

    startTransition(async () => {
      const result = await createOrUpdateMission(formData);
      if (result.success) showFlash("mission");
    });
  };

  const registrationEnabled = initialSettings.registration_enabled ?? "true";
  const maintenanceMode = initialSettings.maintenance_mode ?? "false";
  const maxReportsPerDay = initialSettings.max_reports_per_day ?? "10";
  const autoBanThreshold = initialSettings.auto_ban_threshold ?? "5";

  return (
    <div className="space-y-8">
      {/* General Settings */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="text-lg font-bold text-foreground tracking-wide mb-4">
          General
        </h2>
        <div className="space-y-4">
          {/* Registration Enabled */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Registration Enabled
              </p>
              <p className="text-xs text-muted-foreground">
                Allow new users to sign up
              </p>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleToggle("registration_enabled", registrationEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  registrationEnabled === "true"
                    ? "bg-green-500"
                    : "bg-zinc-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    registrationEnabled === "true"
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
              <SuccessFlash show={flash === "registration_enabled"} />
            </div>
          </div>

          {/* Maintenance Mode */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Maintenance Mode
              </p>
              <p className="text-xs text-muted-foreground">
                Show maintenance page to non-admin users
              </p>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleToggle("maintenance_mode", maintenanceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  maintenanceMode === "true"
                    ? "bg-red-500"
                    : "bg-zinc-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    maintenanceMode === "true"
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
              <SuccessFlash show={flash === "maintenance_mode"} />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Mission */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="text-lg font-bold text-foreground tracking-wide mb-4">
          Monthly Mission
          <SuccessFlash show={flash === "mission"} />
        </h2>
        {mission && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <span>{mission.submissionCount} submissions</span>
            <Link
              href="/admin/missions"
              className="text-gx-gold hover:underline"
            >
              Manage Submissions & Winner →
            </Link>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Title</label>
            <input
              type="text"
              value={mTitle}
              onChange={(e) => setMTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
              placeholder="e.g. Weathering Challenge"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              value={mDesc}
              onChange={(e) => setMDesc(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50 resize-none"
              placeholder="Describe the mission challenge"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Rules & Criteria</label>
            <textarea
              value={mRules}
              onChange={(e) => setMRules(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50 resize-none"
              placeholder="Detailed rules, criteria, and requirements"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Prizes</label>
            <textarea
              value={mPrizes}
              onChange={(e) => setMPrizes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50 resize-none"
              placeholder="Prize description for winners"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Start Date</label>
              <input
                type="datetime-local"
                value={mStart}
                onChange={(e) => setMStart(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
              <input
                type="datetime-local"
                value={mEnd}
                onChange={(e) => setMEnd(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">Make this mission visible on the forum</p>
            </div>
            <button
              type="button"
              onClick={() => setMActive(!mActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                mActive ? "bg-green-500" : "bg-zinc-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  mActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <button
            type="button"
            disabled={isPending || !mTitle || !mStart || !mEnd}
            onClick={handleSaveMission}
            className="px-4 py-2 rounded-lg bg-gx-gold/15 text-gx-gold text-sm font-medium hover:bg-gx-gold/25 transition-colors disabled:opacity-50"
          >
            {mission ? "Update Mission" : "Create Mission"}
          </button>
        </div>
      </div>

      {/* Moderation Settings */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="text-lg font-bold text-foreground tracking-wide mb-4">
          Moderation
        </h2>
        <div className="space-y-4">
          {/* Max Reports Per Day */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Max Reports Per Day
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum reports a user can submit per day
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={maxReportsPerDay}
                min={1}
                max={100}
                className="w-20 px-3 py-1.5 rounded-lg border border-border/50 bg-card text-sm text-foreground text-right focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
                onBlur={(e) => handleNumberChange("max_reports_per_day", e.target.value)}
              />
              <SuccessFlash show={flash === "max_reports_per_day"} />
            </div>
          </div>

          {/* Auto-Ban Threshold */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Auto-Ban Report Threshold
              </p>
              <p className="text-xs text-muted-foreground">
                Number of reports before auto-ban triggers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={autoBanThreshold}
                min={1}
                max={100}
                className="w-20 px-3 py-1.5 rounded-lg border border-border/50 bg-card text-sm text-foreground text-right focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
                onBlur={(e) => handleNumberChange("auto_ban_threshold", e.target.value)}
              />
              <SuccessFlash show={flash === "auto_ban_threshold"} />
            </div>
          </div>
        </div>
      </div>

      {/* Profanity Settings */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="text-lg font-bold text-foreground tracking-wide mb-4">
          Profanity Filter
          <SuccessFlash show={flash === "profanity_custom_words"} />
        </h2>
        <div className="space-y-4">
          {/* Add Word */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddWord();
                }
              }}
              placeholder="Add a word..."
              className="flex-1 px-3 py-2 rounded-lg border border-border/50 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gx-gold/50"
            />
            <button
              type="button"
              disabled={isPending || !newWord.trim()}
              onClick={handleAddWord}
              className="px-4 py-2 rounded-lg bg-gx-gold/15 text-gx-gold text-sm font-medium hover:bg-gx-gold/25 transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </div>

          {/* Word Tags */}
          <div className="flex flex-wrap gap-2">
            {words.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No custom words added.
              </p>
            ) : (
              words.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 text-xs font-medium border border-red-500/30"
                >
                  {word}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleRemoveWord(word)}
                    className="hover:text-red-300 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
