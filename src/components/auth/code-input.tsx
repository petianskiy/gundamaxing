"use client";

import { useRef, useCallback, KeyboardEvent, ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  length?: number;
}

export function CodeInput({ value, onChange, disabled, length = 6 }: CodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.padEnd(length, "").split("").slice(0, length);

  const focusInput = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, length - 1));
    inputRefs.current[clamped]?.focus();
  }, [length]);

  function handleChange(index: number, char: string) {
    if (!/^\d$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    onChange(newDigits.join("").replace(/\s/g, ""));

    if (index < length - 1) {
      focusInput(index + 1);
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newDigits = [...digits];
      if (digits[index] && digits[index] !== " ") {
        newDigits[index] = " ";
        onChange(newDigits.join("").trimEnd());
      } else if (index > 0) {
        newDigits[index - 1] = " ";
        onChange(newDigits.join("").trimEnd());
        focusInput(index - 1);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      focusInput(index + 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted.length > 0) {
      onChange(pasted);
      focusInput(Math.min(pasted.length, length - 1));
    }
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit === " " ? "" : digit}
          disabled={disabled}
          className={cn(
            "h-14 w-11 sm:h-16 sm:w-13 rounded-lg border-2 bg-gx-surface text-center text-2xl font-bold text-foreground",
            "focus:outline-none focus:border-gx-red focus:ring-1 focus:ring-gx-red/30 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            digit && digit !== " " ? "border-gx-red/50" : "border-border/50"
          )}
          onChange={(e) => {
            const val = e.target.value;
            if (val.length === 1) handleChange(i, val);
          }}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
