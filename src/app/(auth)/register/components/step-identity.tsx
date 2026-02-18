"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { stepBSchema, type StepBInput } from "@/lib/validations/registration-wizard";

interface StepIdentityProps {
  data: Partial<StepBInput>;
  onNext: (data: StepBInput) => void;
  onBack: () => void;
}

const SKILL_LEVELS = [
  { value: "BEGINNER", label: "BEGINNER", desc: "Just getting started" },
  { value: "INTERMEDIATE", label: "INTERMEDIATE", desc: "A few builds under my belt" },
  { value: "ADVANCED", label: "ADVANCED", desc: "Experienced builder" },
  { value: "EXPERT", label: "EXPERT", desc: "Master grade craftsman" },
] as const;

const GRADES = [
  "HG", "RG", "MG", "PG", "SD", "EG", "MEGA_SIZE", "RE_100", "FM",
] as const;

const TIMELINES = [
  { value: "UC", label: "UC", full: "Universal Century" },
  { value: "CE", label: "CE", full: "Cosmic Era" },
  { value: "AC", label: "AC", full: "After Colony" },
  { value: "FC", label: "FC", full: "Future Century" },
  { value: "AW", label: "AW", full: "After War" },
  { value: "CC", label: "CC", full: "Correct Century" },
  { value: "AD", label: "AD", full: "Anno Domini" },
  { value: "PD", label: "PD", full: "Post Disaster" },
  { value: "RC", label: "RC", full: "Regild Century" },
] as const;

const COUNTRIES = [
  "Japan", "United States", "Canada", "United Kingdom", "Australia",
  "Germany", "France", "South Korea", "Philippines", "Singapore",
  "Malaysia", "Thailand", "Indonesia", "Taiwan", "Hong Kong",
  "Brazil", "Mexico", "Italy", "Spain", "Netherlands",
  "Sweden", "Norway", "Denmark", "Finland", "Poland",
  "Russia", "China", "India", "New Zealand", "Other",
] as const;

export function StepIdentity({ data, onNext, onBack }: StepIdentityProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<StepBInput>({
    resolver: zodResolver(stepBSchema),
    defaultValues: {
      country: data.country ?? "",
      skillLevel: data.skillLevel,
      preferredGrades: data.preferredGrades ?? [],
      favoriteTimelines: data.favoriteTimelines ?? [],
    },
    mode: "onChange",
  });

  function onSubmit(values: StepBInput) {
    onNext(values);
  }

  return (
    <div className="space-y-6">
      {/* Step header */}
      <div className="space-y-1">
        <p className="text-[10px] font-mono tracking-[0.3em] text-gx-red uppercase">
          Step 02 of 04
        </p>
        <h2 className="text-xl font-bold tracking-wider text-foreground">
          PILOT IDENTIFICATION
        </h2>
        <p className="text-xs font-mono tracking-wider text-muted-foreground/60">
          CALLSIGN REGISTRATION
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Country */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Country
          </label>
          <select
            className={cn(
              "w-full px-3 py-2.5 rounded-lg border bg-gx-surface text-foreground text-sm",
              "focus:outline-none focus:ring-1 transition-colors",
              "border-border/50 focus:border-gx-red/50 focus:ring-gx-red/20",
              "appearance-none cursor-pointer"
            )}
            {...register("country")}
          >
            <option value="">Select your country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Skill Level */}
        <Controller
          control={control}
          name="skillLevel"
          render={({ field }) => (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Skill Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SKILL_LEVELS.map((level) => {
                  const isSelected = field.value === level.value;
                  return (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => field.onChange(level.value)}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-all",
                        isSelected
                          ? "border-gx-red bg-gx-red/10 ring-1 ring-gx-red/30"
                          : "border-border/50 bg-gx-surface hover:border-border hover:bg-gx-surface-elevated"
                      )}
                    >
                      <span
                        className={cn(
                          "block text-xs font-mono font-bold tracking-wider",
                          isSelected ? "text-gx-red" : "text-foreground"
                        )}
                      >
                        {level.label}
                      </span>
                      <span className="block text-[10px] text-muted-foreground/60 mt-0.5">
                        {level.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        />

        {/* Preferred Grades */}
        <Controller
          control={control}
          name="preferredGrades"
          render={({ field }) => (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Preferred Grades
              </label>
              <div className="flex flex-wrap gap-2">
                {GRADES.map((grade) => {
                  const isSelected = field.value?.includes(grade) ?? false;
                  return (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => {
                        const current = field.value ?? [];
                        field.onChange(
                          isSelected
                            ? current.filter((g) => g !== grade)
                            : [...current, grade]
                        );
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-mono font-medium tracking-wider border transition-all",
                        isSelected
                          ? "border-gx-red bg-gx-red/15 text-gx-red"
                          : "border-border/50 bg-gx-surface text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                    >
                      {grade.replace("_", " ")}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        />

        {/* Favorite Timelines */}
        <Controller
          control={control}
          name="favoriteTimelines"
          render={({ field }) => (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Favorite Timelines
              </label>
              <div className="flex flex-wrap gap-2">
                {TIMELINES.map((tl) => {
                  const isSelected = field.value?.includes(tl.value) ?? false;
                  return (
                    <button
                      key={tl.value}
                      type="button"
                      title={tl.full}
                      onClick={() => {
                        const current = field.value ?? [];
                        field.onChange(
                          isSelected
                            ? current.filter((v) => v !== tl.value)
                            : [...current, tl.value]
                        );
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-mono font-medium tracking-wider border transition-all",
                        isSelected
                          ? "border-gx-red bg-gx-red/15 text-gx-red"
                          : "border-border/50 bg-gx-surface text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                    >
                      <span>{tl.label}</span>
                      <span className="text-[9px] text-muted-foreground/50 ml-1 hidden sm:inline">
                        {tl.full}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        />

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onBack}
            className="font-mono tracking-wider"
          >
            <ChevronLeft className="h-4 w-4" />
            BACK
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!isValid}
            className="flex-1 font-mono tracking-wider"
          >
            NEXT
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
