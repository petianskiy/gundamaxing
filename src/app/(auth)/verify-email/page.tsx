"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<
    "pending" | "verifying" | "verified" | "error"
  >(token ? "verifying" : "pending");
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    async function verifyToken() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          setStatus("verified");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    }

    verifyToken();
  }, [token]);

  async function handleResend() {
    setIsResending(true);
    setResendSuccess(false);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });

      if (res.ok) {
        setResendSuccess(true);
      }
    } catch {
      // silently fail
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gx-surface px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="rounded-xl border border-border/50 bg-card p-6 sm:p-8 text-center">
          {status === "verifying" && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-gx-red" />
              <h1 className="mt-6 text-2xl font-bold tracking-wider text-white">
                VERIFYING
              </h1>
              <p className="mt-2 font-mono text-sm text-gray-500">
                Processing your verification token...
              </p>
            </>
          )}

          {status === "verified" && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <h1 className="mt-6 text-2xl font-bold tracking-wider text-white">
                EMAIL VERIFIED
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                Your email has been successfully verified. You can now log in.
              </p>
              <Link href="/login" className="mt-6 inline-block">
                <Button variant="primary">PROCEED TO LOGIN</Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h1 className="mt-6 text-2xl font-bold tracking-wider text-white">
                VERIFICATION FAILED
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                The verification link is invalid or has expired.
              </p>
              <Button
                variant="secondary"
                className="mt-6"
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend verification email"
                )}
              </Button>
            </>
          )}

          {status === "pending" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border/50 bg-gx-red/10">
                <Mail className="h-8 w-8 text-gx-red" />
              </div>
              <h1 className="mt-6 text-2xl font-bold tracking-wider text-white">
                CHECK YOUR EMAIL
              </h1>
              <p className="mt-2 font-mono text-sm tracking-widest text-gray-500">
                VERIFICATION REQUIRED
              </p>
              <p className="mt-4 text-sm text-gray-400">
                We&apos;ve sent a verification link to your email address.
                Please check your inbox and click the link to activate your
                account.
              </p>

              <div className="mt-8 space-y-3">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleResend}
                  disabled={isResending || resendSuccess}
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : resendSuccess ? (
                    "Verification email resent!"
                  ) : (
                    "Resend verification email"
                  )}
                </Button>

                <Link href="/login" className="block">
                  <Button variant="secondary" className="w-full">
                    Back to login
                  </Button>
                </Link>
              </div>
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
