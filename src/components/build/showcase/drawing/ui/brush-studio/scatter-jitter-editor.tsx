"use client";

import { cn } from "@/lib/utils";

interface ScatterJitterEditorProps {
  scatter: number;
  jitterSize: number;
  jitterOpacity: number;
  jitterRotation: number;
  onChange: (values: {
    scatter: number;
    jitterSize: number;
    jitterOpacity: number;
    jitterRotation: number;
  }) => void;
}

const sliderClassName =
  "flex-1 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500";

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: SliderRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-zinc-500 w-16">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={sliderClassName}
      />
      <span className="text-[10px] text-zinc-400 w-8 text-right">
        {Math.round(value)}
        {suffix}
      </span>
    </div>
  );
}

export function ScatterJitterEditor({
  scatter,
  jitterSize,
  jitterOpacity,
  jitterRotation,
  onChange,
}: ScatterJitterEditorProps) {
  function update(
    patch: Partial<{
      scatter: number;
      jitterSize: number;
      jitterOpacity: number;
      jitterRotation: number;
    }>
  ) {
    onChange({
      scatter,
      jitterSize,
      jitterOpacity,
      jitterRotation,
      ...patch,
    });
  }

  return (
    <div className="space-y-1.5">
      <SliderRow
        label="Scatter"
        value={scatter}
        min={0}
        max={500}
        step={1}
        suffix="%"
        onChange={(v) => update({ scatter: v })}
      />
      <SliderRow
        label="Size Jitter"
        value={jitterSize}
        min={0}
        max={100}
        step={1}
        suffix="%"
        onChange={(v) => update({ jitterSize: v })}
      />
      <SliderRow
        label="Opacity Jitter"
        value={jitterOpacity}
        min={0}
        max={100}
        step={1}
        suffix="%"
        onChange={(v) => update({ jitterOpacity: v })}
      />
      <SliderRow
        label="Rotation Jitter"
        value={jitterRotation}
        min={0}
        max={360}
        step={1}
        suffix={"\u00B0"}
        onChange={(v) => update({ jitterRotation: v })}
      />
    </div>
  );
}
