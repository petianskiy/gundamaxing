"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface TextChallenge {
  challengeId: string;
  type: "TEXT_LOGIC";
  question: string;
}

interface CaptchaAccessibleProps {
  onVerify: (valid: boolean) => void;
  className?: string;
}

export function CaptchaAccessible({ onVerify, className }: CaptchaAccessibleProps) {
  const [challenge, setChallenge] = useState<TextChallenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<"success" | "failure" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchChallenge = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnswer("");
    setResult(null);

    try {
      const res = await fetch("/api/captcha/generate?mode=text");
      if (!res.ok) {
        if (res.status === 429) {
          setError("Too many requests. Please wait a moment.");
          return;
        }
        throw new Error("Failed to load challenge");
      }
      const data: TextChallenge = await res.json();
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

  // Focus the input when challenge loads
  useEffect(() => {
    if (challenge && !loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [challenge, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!challenge || verifying || result === "success") return;

    const trimmed = answer.trim();
    if (!trimmed) return;

    setVerifying(true);

    try {
      const res = await fetch("/api/captcha/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          selectedId: trimmed,
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
      aria-label="Accessible identity verification challenge"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 bg-black/20">
        <h3 className="text-sm font-bold tracking-widest text-foreground uppercase">
          Identity Verification
        </h3>
        <p className="text-xs font-mono text-muted-foreground mt-0.5">
          ANSWER THE QUESTION BELOW
        </p>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div
              className="animate-spin h-6 w-6 border-2 border-gx-red border-t-transparent rounded-full"
              role="status"
              aria-label="Loading challenge"
            />
            <p className="text-xs text-muted-foreground font-mono" aria-live="polite">
              LOADING CHALLENGE...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <p className="text-xs text-red-400 text-center" role="alert">
              {error}
            </p>
            <button
              onClick={fetchChallenge}
              className="px-3 py-1.5 text-xs font-medium rounded border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : challenge ? (
          <form onSubmit={handleSubmit} noValidate>
            {/* Question */}
            <label
              htmlFor="captcha-answer"
              className="block text-sm text-foreground mb-3 leading-relaxed"
            >
              {challenge.question}
            </label>

            {/* Answer input */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                id="captcha-answer"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={verifying || result === "success"}
                placeholder="Enter your answer"
                className={cn(
                  "flex-1 px-3 py-2.5 rounded-lg border bg-gx-surface text-foreground text-sm",
                  "placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:ring-1 transition-colors",
                  result === "failure"
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                    : result === "success"
                      ? "border-green-500/50"
                      : "border-border/50 focus:border-gx-red/50 focus:ring-gx-red/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                aria-describedby="captcha-result"
                aria-invalid={result === "failure" ? "true" : undefined}
              />
              <button
                type="submit"
                disabled={verifying || result === "success" || !answer.trim()}
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  "bg-gx-red text-white hover:bg-red-700 active:bg-red-800",
                  "focus:outline-none focus:ring-2 focus:ring-gx-red/30 focus:ring-offset-2 focus:ring-offset-background",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {verifying ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  "Submit"
                )}
              </button>
            </div>

            {/* Result indicator */}
            <div id="captcha-result" aria-live="polite" className="mt-3">
              {result === "success" && (
                <div className="flex items-center gap-2 text-green-400" role="status">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-mono">VERIFIED</span>
                </div>
              )}

              {result === "failure" && (
                <div className="flex items-center gap-2 text-red-400" role="alert">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-xs font-mono">INCORRECT - RELOADING...</span>
                </div>
              )}
            </div>
          </form>
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
