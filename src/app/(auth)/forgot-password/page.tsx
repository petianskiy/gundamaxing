"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { usePasswordStrength } from "@/hooks/use-password-strength";
import { cn } from "@/lib/utils";

type Step = "email" | "code" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const strength = usePasswordStrength(password);
  const passwordsMatch = password === confirmPassword;

  useEffect(() => {
    if (step === "success") {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, router]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStep("code");
      } else {
        setError("Failed to send reset code. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    if (strength.score < 2) {
      setError("Password is too weak. Please choose a stronger password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });

      if (res.ok) {
        setStep("success");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to reset password.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    setResendSuccess(false);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setResendSuccess(true);
        setCode("");
      }
    } catch {
      // silently fail
    } finally {
      setIsResending(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-md mx-auto"
    >
      <div className="rounded-xl border border-border/50 bg-card p-6 sm:p-8">
          {/* Step 3: Success */}
          {step === "success" && (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <h1 className="mt-6 text-2xl font-bold tracking-wider text-white">
                CREDENTIALS UPDATED
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                Your password has been reset. Redirecting to login...
              </p>
              <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-gray-500" />
            </div>
          )}

          {/* Step 1: Email */}
          {step === "email" && (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold tracking-wider text-white">
                  RESET ACCESS CODES
                </h1>
                <p className="mt-2 font-mono text-sm text-gray-500">
                  Enter your email to receive a reset code
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium uppercase tracking-wider text-gray-400"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="pilot@gundamaxing.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      SENDING...
                    </>
                  ) : (
                    "SEND RESET CODE"
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 transition-colors hover:text-gray-300"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to login
                </Link>
              </p>
            </>
          )}

          {/* Step 2: Code + New Password */}
          {step === "code" && (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold tracking-wider text-white">
                  SET NEW ACCESS CODES
                </h1>
                <p className="mt-2 font-mono text-sm text-gray-500">
                  Enter the code sent to{" "}
                  <span className="text-gray-300">{email}</span>
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleResetSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="code"
                    className="block text-xs font-medium uppercase tracking-wider text-gray-400"
                  >
                    Verification Code
                  </label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={6}
                    value={code}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setCode(v);
                    }}
                    disabled={isLoading}
                    className="text-center text-2xl font-bold tracking-[0.5em] placeholder:tracking-[0.5em]"
                  />
                </div>

                <div className="space-y-2">
                  <PasswordInput
                    label="New Password"
                    id="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    disabled={isLoading}
                  />
                  {password.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1 flex-1 rounded-full transition-colors",
                              i <= strength.score - 1
                                ? strength.score <= 1
                                  ? "bg-red-500"
                                  : strength.score === 2
                                  ? "bg-orange-500"
                                  : strength.score === 3
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                                : "bg-gray-700"
                            )}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${strength.color}`}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                <PasswordInput
                  label="Confirm Password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  disabled={isLoading}
                  error={confirmPassword.length > 0 && !passwordsMatch ? "Passwords do not match" : undefined}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading || code.length !== 6 || !password || !confirmPassword || !passwordsMatch}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      UPDATING...
                    </>
                  ) : (
                    "UPDATE CREDENTIALS"
                  )}
                </Button>
              </form>

              <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending || resendSuccess}
                  className="transition-colors hover:text-gray-300 disabled:opacity-50"
                >
                  {isResending ? "Sending..." : resendSuccess ? "Code resent!" : "Resend code"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setPassword("");
                    setConfirmPassword("");
                    setError(null);
                  }}
                  className="transition-colors hover:text-gray-300"
                >
                  Different email
                </button>
              </div>
            </>
          )}
        </div>

      {/* Decorative bottom line */}
      <div className="mt-4 flex justify-center">
        <div className="h-1 w-16 rounded-full bg-gx-red/30" />
      </div>
    </motion.div>
  );
}
