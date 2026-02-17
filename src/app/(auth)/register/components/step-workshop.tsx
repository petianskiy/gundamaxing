"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { stepCSchema, type StepCInput } from "@/lib/validations/registration-wizard";

interface StepWorkshopProps {
  data: Partial<StepCInput>;
  onNext: (data: StepCInput) => void;
  onBack: () => void;
}

const TOOLS = [
  { value: "Airbrush", desc: "Precision paint spraying system" },
  { value: "Spray Can", desc: "Rattle can painting" },
  { value: "Hand Brush", desc: "Manual brush painting" },
  { value: "Panel Liner", desc: "Fine line detailing marker" },
  { value: "Nippers", desc: "Gate-cutting precision nippers" },
  { value: "Hobby Knife", desc: "X-Acto or similar craft knife" },
  { value: "Sanding Sticks", desc: "Multi-grit sanding tools" },
  { value: "Pin Vise", desc: "Hand drill for small holes" },
  { value: "Putty", desc: "Gap filling and sculpting" },
  { value: "Masking Tape", desc: "Precision masking for paint" },
  { value: "Topcoat", desc: "Matte, gloss, or satin finish" },
  { value: "Decal Tools", desc: "Setting solution and softener" },
  { value: "Scribing Tools", desc: "Panel line scribers" },
  { value: "LED Kit", desc: "Lighting electronics for builds" },
  { value: "Magnifying Glass", desc: "Precision detail work" },
  { value: "Cutting Mat", desc: "Self-healing work surface" },
] as const;

const TECHNIQUES = [
  { value: "Weathering", desc: "Simulating wear, rust, and battle damage" },
  { value: "Kitbashing", desc: "Combining parts from multiple kits" },
  { value: "Scribing", desc: "Adding custom panel lines" },
  { value: "LED Installation", desc: "Adding electronic lighting" },
  { value: "Hand Painting", desc: "Brush-applied paint finishes" },
  { value: "Airbrushing", desc: "Spray gun paint application" },
  { value: "Dry Brushing", desc: "Highlighting edges with paint" },
  { value: "Panel Lining", desc: "Inking recessed panel lines" },
  { value: "Decal Application", desc: "Water-slide or dry transfer decals" },
  { value: "Preshading", desc: "Painting dark base before color coat" },
  { value: "Candy Coating", desc: "Metallic base with clear color coat" },
  { value: "Chipping", desc: "Simulating paint chips with sponge or brush" },
  { value: "Oil Washing", desc: "Oil paint washes for depth" },
  { value: "Resin Casting", desc: "Creating custom parts with resin" },
  { value: "Custom Waterslides", desc: "Printing your own decals" },
  { value: "Plating", desc: "Chrome or metallic plating effects" },
] as const;

function ChipSelector({
  items,
  selected,
  onChange,
  label,
}: {
  items: readonly { value: string; desc: string }[];
  selected: string[];
  onChange: (value: string[]) => void;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isSelected = selected.includes(item.value);
          return (
            <button
              key={item.value}
              type="button"
              title={item.desc}
              onClick={() => {
                onChange(
                  isSelected
                    ? selected.filter((s) => s !== item.value)
                    : [...selected, item.value]
                );
              }}
              className={cn(
                "group relative px-3 py-1.5 rounded-md text-xs font-mono font-medium tracking-wider border transition-all",
                isSelected
                  ? "border-gx-red bg-gx-red/15 text-gx-red"
                  : "border-border/50 bg-gx-surface text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {item.value}
              {/* Tooltip */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-gx-surface-elevated border border-border/50 text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {item.desc}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] font-mono text-muted-foreground/40 flex items-center gap-1">
        <Info className="h-3 w-3" />
        Hover over each option for details. Select all that apply.
      </p>
    </div>
  );
}

export function StepWorkshop({ data, onNext, onBack }: StepWorkshopProps) {
  const {
    handleSubmit,
    control,
    formState: { isValid },
  } = useForm<StepCInput>({
    resolver: zodResolver(stepCSchema),
    defaultValues: {
      tools: data.tools ?? [],
      techniques: data.techniques ?? [],
    },
    mode: "onChange",
  });

  function onSubmit(values: StepCInput) {
    onNext(values);
  }

  return (
    <div className="space-y-6">
      {/* Step header */}
      <div className="space-y-1">
        <p className="text-[10px] font-mono tracking-[0.3em] text-gx-red uppercase">
          Step 03 of 04
        </p>
        <h2 className="text-xl font-bold tracking-wider text-foreground">
          HANGAR CONFIGURATION
        </h2>
        <p className="text-xs font-mono tracking-wider text-muted-foreground/60">
          WORKSHOP LOADOUT
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tools */}
        <Controller
          control={control}
          name="tools"
          render={({ field }) => (
            <ChipSelector
              items={TOOLS}
              selected={field.value ?? []}
              onChange={field.onChange}
              label="Tools in Your Arsenal"
            />
          )}
        />

        {/* Techniques */}
        <Controller
          control={control}
          name="techniques"
          render={({ field }) => (
            <ChipSelector
              items={TECHNIQUES}
              selected={field.value ?? []}
              onChange={field.onChange}
              label="Techniques You Practice"
            />
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
