"use client";

import { useRef, useCallback, useState, KeyboardEvent, ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  length?: number;
}

export function CodeInput({ value, onChange, disabled, length = 6 }: CodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focused, setFocused] = useState(false);

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
    <div className="space-y-1">
      <div
        className={cn(
          "flex justify-center gap-2 sm:gap-3",
          focused && "ring-0"
        )}
      >
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit === " " ? "" : digit}
            disabled={disabled}
            style={{
              width: "3rem",
              height: "3.5rem",
              fontSize: "1.5rem",
              fontWeight: 700,
              textAlign: "center",
              borderRadius: "0.5rem",
              borderWidth: "2px",
              borderStyle: "solid",
              borderColor: digit && digit !== " " ? "#dc2626" : "#52525b",
              backgroundColor: "#1a1a1f",
              color: "#fafafa",
              outline: "none",
              caretColor: "#dc2626",
              transition: "border-color 0.15s",
              opacity: disabled ? 0.5 : 1,
            }}
            onChange={(e) => {
              const val = e.target.value;
              if (val.length === 1) handleChange(i, val);
            }}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => {
              setFocused(true);
              e.target.select();
              e.target.style.borderColor = "#dc2626";
              e.target.style.boxShadow = "0 0 0 2px rgba(220, 38, 38, 0.2)";
            }}
            onBlur={(e) => {
              setFocused(false);
              const hasValue = e.target.value && e.target.value !== " ";
              e.target.style.borderColor = hasValue ? "#dc2626" : "#52525b";
              e.target.style.boxShadow = "none";
            }}
          />
        ))}
      </div>
    </div>
  );
}
