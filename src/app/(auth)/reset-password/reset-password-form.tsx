"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePasswordStrength } from "@/hooks/use-password-strength";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const strength = usePasswordStrength(password);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
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
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setIsSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to reset password. The link may have expired.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gx-surface px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="rounded-xl border border-border/50 bg-card p-6 sm:p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="mt-6 text-2xl font-bold tracking-wider text-white">
              INVALID LINK
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              This password reset link is invalid or has expired.
            </p>
            <Link href="/forgot-password" className="mt-6 inline-block">
              <Button variant="primary">Request new link</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gx-surface px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="rounded-xl border border-border/50 bg-card p-6 sm:p-8">
          {isSuccess ? (
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
          ) : (
            <>
              {/* Header */}
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold tracking-wider text-white">
                  SET NEW ACCESS CODES
                </h1>
                <p className="mt-2 font-mono text-sm text-gray-500">
                  Choose a strong password for your account
                </p>
              </div>

              {/* Error display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium uppercase tracking-wider text-gray-400"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-300"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Password strength meter */}
                  {password.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i <= strength.score - 1
                                ? strength.score <= 1
                                  ? "bg-red-500"
                                  : strength.score === 2
                                  ? "bg-orange-500"
                                  : strength.score === 3
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                                : "bg-gray-700"
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${strength.color}`}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-medium uppercase tracking-wider text-gray-400"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-300"
                      tabIndex={-1}
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="text-xs text-red-400">Passwords do not match</p>
                  )}
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
                      UPDATING...
                    </>
                  ) : (
                    "UPDATE CREDENTIALS"
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                <Link
                  href="/login"
                  className="transition-colors hover:text-gray-300"
                >
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Decorative bottom line */}
        <div className="mt-4 flex justify-center">
          <div className="h-1 w-16 rounded-full bg-gx-red/30" />
        </div>
      </motion.div>
    </div>
  );
}
