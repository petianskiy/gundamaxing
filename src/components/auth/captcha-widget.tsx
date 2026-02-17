"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CaptchaChallenge {
  challengeId: string;
  type: string;
  promptSvg?: string;
  promptImage?: string;
  promptLabel: string;
  options: { id: string; svg?: string; label?: string }[];
}

interface CaptchaWidgetProps {
  onVerify: (valid: boolean) => void;
  className?: string;
}

export function CaptchaWidget({ onVerify, className }: CaptchaWidgetProps) {
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<"success" | "failure" | null>(null);

  const fetchChallenge = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedId(null);
    setResult(null);

    try {
      const res = await fetch("/api/captcha/generate");
      if (!res.ok) {
        if (res.status === 429) {
          setError("Too many requests. Please wait a moment.");
          return;
        }
        throw new Error("Failed to load challenge");
      }
      const data: CaptchaChallenge = await res.json();
      setChallenge(data);
    } catch {
      setError("Failed to load verification challenge. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  const handleSelect = async (optionId: string) => {
    if (verifying || result) return;

    setSelectedId(optionId);
    setVerifying(true);

    try {
      const res = await fetch("/api/captcha/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge?.challengeId,
          selectedId: optionId,
        }),
      });

      const data = await res.json();
      const isValid = data.valid === true;

      setResult(isValid ? "success" : "failure");
      onVerify(isValid);

      if (!isValid) {
        // Auto-refresh after a failed attempt
        setTimeout(() => {
          fetchChallenge();
        }, 1500);
      }
    } catch {
      setError("Verification failed. Please try again.");
      setResult(null);
      setSelectedId(null);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      className={cn(
        "w-full max-w-md rounded-lg border border-border/50 bg-gx-surface overflow-hidden",
        className
      )}
      role="group"
      aria-label="Identity verification challenge"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 bg-black/20">
        <h3 className="text-sm font-bold tracking-widest text-foreground uppercase">
          Identity Verification
        </h3>
        <p className="text-xs font-mono text-muted-foreground mt-0.5">
          {challenge?.promptLabel || "SELECT THE MATCHING UNIT"}
        </p>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="animate-spin h-6 w-6 border-2 border-gx-red border-t-transparent rounded-full" />
            <p className="text-xs text-muted-foreground font-mono">
              LOADING CHALLENGE...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <p className="text-xs text-red-400 text-center">{error}</p>
            <button
              onClick={fetchChallenge}
              className="px-3 py-1.5 text-xs font-medium rounded border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : challenge ? (
          <>
            {/* Prompt: Image or SVG */}
            <div className="flex justify-center mb-4">
              {challenge.promptImage ? (
                <div className="p-2 rounded-lg border border-border/30 bg-black/30">
                  <img
                    src={challenge.promptImage}
                    alt="Identify this mobile suit"
                    className="w-32 h-32 object-contain"
                    draggable={false}
                  />
                </div>
              ) : challenge.promptSvg ? (
                <div
                  className="p-3 rounded border border-border/30 bg-black/30"
                  dangerouslySetInnerHTML={{ __html: challenge.promptSvg }}
                  aria-hidden="true"
                />
              ) : null}
            </div>

            {/* Options: text labels or SVG grid */}
            <div
              className={cn(
                "gap-2",
                challenge.options[0]?.label
                  ? "flex flex-col"
                  : "grid grid-cols-2"
              )}
              role="radiogroup"
              aria-label="Select the correct option"
            >
              {challenge.options.map((option, index) => {
                const isSelected = selectedId === option.id;
                const isSuccess = isSelected && result === "success";
                const isFailure = isSelected && result === "failure";

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    disabled={verifying || result === "success"}
                    className={cn(
                      "flex items-center justify-center rounded border-2 transition-all duration-200",
                      "hover:border-gx-red/60 hover:bg-white/5 cursor-pointer",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                      "focus:outline-none focus:ring-2 focus:ring-gx-red/30",
                      option.label ? "px-4 py-2.5 text-sm font-medium" : "p-3",
                      isSuccess
                        ? "border-green-500 bg-green-500/10"
                        : isFailure
                          ? "border-red-500 bg-red-500/10"
                          : isSelected
                            ? "border-gx-red bg-gx-red/10"
                            : "border-border/30 bg-black/20"
                    )}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={option.label || `Option ${index + 1}`}
                  >
                    {option.label ? (
                      <span className={cn(
                        "font-mono tracking-wider text-xs",
                        isSuccess ? "text-green-400" : isFailure ? "text-red-400" : "text-foreground"
                      )}>
                        {option.label}
                      </span>
                    ) : option.svg ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: option.svg }}
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Result indicator */}
            {result === "success" && (
              <div className="mt-3 flex items-center justify-center gap-2 text-green-400" role="status">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs font-mono">VERIFIED</span>
              </div>
            )}

            {result === "failure" && (
              <div className="mt-3 flex items-center justify-center gap-2 text-red-400" role="alert">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-xs font-mono">INCORRECT - RELOADING...</span>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border/30 bg-black/20 flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
          Gundam CAPTCHA
        </span>
        <button
          onClick={fetchChallenge}
          disabled={loading || verifying}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium rounded",
            "text-muted-foreground hover:text-foreground transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="Refresh challenge"
        >
          <svg
            className={cn("h-3 w-3", loading && "animate-spin")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          REFRESH
        </button>
      </div>
    </div>
  );
}
