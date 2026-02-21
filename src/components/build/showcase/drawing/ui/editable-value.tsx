"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface EditableValueProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  className?: string;
}

export function EditableValue({
  value,
  onChange,
  min = 0,
  max = 999,
  suffix = "",
  className,
}: EditableValueProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    const parsed = parseInt(draft, 10);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    }
    setEditing(false);
  }, [draft, onChange, min, max]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setEditing(false);
      }
    },
    [commit]
  );

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={min}
        max={max}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-10 bg-zinc-800 text-[10px] text-zinc-200 px-1 py-0.5 rounded border border-blue-500/50 text-center outline-none",
          className
        )}
      />
    );
  }

  return (
    <span
      onClick={() => {
        setDraft(String(Math.round(value)));
        setEditing(true);
      }}
      className={cn(
        "text-[10px] text-zinc-400 cursor-pointer hover:text-blue-400 hover:underline decoration-dotted transition-colors select-none",
        className
      )}
      title="Click to type exact value"
    >
      {Math.round(value)}
      {suffix}
    </span>
  );
}
