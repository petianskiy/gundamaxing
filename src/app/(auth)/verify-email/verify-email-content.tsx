"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CodeInput } from "@/components/auth/code-input";

export function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [code, setCode] = useState("");
  const [status, setStatus] = useState<
    "pending" | "verifying" | "verified" | "error"
  >("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  async function handleVerify() {
    if (!email || code.length !== 6) return;

    setStatus("verifying");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (res.ok) {
        setStatus("verified");
      } else {
        const data = await res.json();
        setStatus("error");
        setErrorMessage(data.error || "Verification failed");
      }
    } catch {
      setStatus("error");
      setErrorMessage("An unexpected error occurred.");
    }
  }

  async function handleResend() {
    if (!email) return;
    setIsResending(true);
    setResendSuccess(false);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setResendSuccess(true);
        setCode("");
        if (status === "error") setStatus("pending");
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
      <div className="rounded-xl border border-border/50 bg-card p-6 sm:p-8 text-center">
        {status === "verifying" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-gx-red" />
            <h1 className="mt-6 text-2xl font-bold tracking-wider text-white">
              VERIFYING
            </h1>
            <p className="mt-2 font-mono text-sm text-gray-500">
              Processing your verification code...
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
              {errorMessage || "The verification code is invalid or has expired."}
            </p>
            <div className="mt-6 space-y-3">
              {email && (
                <>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      setCode("");
                      setStatus("pending");
                      setErrorMessage(null);
                    }}
                  >
                    Try Again
                  </Button>
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
                      "New code sent!"
                    ) : (
                      "Resend code"
                    )}
                  </Button>
                </>
              )}
              {!email && (
                <Link href="/login" className="block">
                  <Button variant="secondary" className="w-full">
                    Back to login
                  </Button>
                </Link>
              )}
            </div>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border/50 bg-gx-red/10">
              <Mail className="h-8 w-8 text-gx-red" />
            </div>
            <h1 className="mt-6 text-2xl font-bold tracking-wider text-white">
              ENTER VERIFICATION CODE
            </h1>
            <p className="mt-2 font-mono text-sm tracking-widest text-gray-500">
              VERIFICATION REQUIRED
            </p>
            <p className="mt-4 text-sm text-gray-400">
              We&apos;ve sent a 6-digit code to{" "}
              {email ? (
                <span className="font-medium text-gray-300">{email}</span>
              ) : (
                "your email address"
              )}
              . Enter it below to verify your account. The code expires in 15 minutes.
            </p>

            <div className="mt-6">
              <CodeInput value={code} onChange={setCode} />
            </div>

            <div className="mt-6 space-y-3">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleVerify}
                disabled={code.length !== 6 || !email}
              >
                VERIFY
              </Button>

              {email && (
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
                    "New code sent!"
                  ) : (
                    "Resend code"
                  )}
                </Button>
              )}

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
  );
}
