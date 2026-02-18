"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyEmailChangeAction } from "@/lib/actions/auth";

function VerifyEmailChangeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"pending" | "verifying" | "verified" | "error">(
    email ? "pending" : "error"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    email ? null : "No email provided"
  );

  async function handleVerify() {
    if (!email || code.length !== 6) return;

    setStatus("verifying");
    setErrorMessage(null);

    const result = await verifyEmailChangeAction(email, code);

    if ("error" in result) {
      setStatus("error");
      setErrorMessage(result.error);
    } else {
      setStatus("verified");
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
              Updating your email address...
            </p>
          </>
        )}

        {status === "verified" && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h1 className="mt-6 text-2xl font-bold tracking-wider text-white">
              EMAIL UPDATED
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Your email address has been successfully changed. Please log in
              with your new email.
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
              {errorMessage || "The email change code is invalid or has expired."}
            </p>
            <div className="mt-6 space-y-3">
              {email && (
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
              )}
              <Link href="/settings/security" className="block">
                <Button variant="secondary" className="w-full">
                  Back to Settings
                </Button>
              </Link>
            </div>
          </>
        )}

        {status === "pending" && (
          <>
            <h1 className="text-2xl font-bold tracking-wider text-white">
              VERIFY NEW EMAIL
            </h1>
            <p className="mt-2 font-mono text-sm tracking-widest text-gray-500">
              EMAIL CHANGE VERIFICATION
            </p>
            <p className="mt-4 text-sm text-gray-400">
              Enter the 6-digit code sent to{" "}
              <span className="font-medium text-gray-300">{email}</span>
            </p>

            <div className="mt-6">
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
                className="text-center text-2xl font-bold tracking-[0.5em] placeholder:tracking-[0.5em]"
              />
            </div>

            <div className="mt-6 space-y-3">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleVerify}
                disabled={code.length !== 6}
              >
                VERIFY
              </Button>
              <Link href="/settings/security" className="block">
                <Button variant="secondary" className="w-full">
                  Back to Settings
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <div className="h-1 w-16 rounded-full bg-gx-red/30" />
      </div>
    </motion.div>
  );
}

export default function VerifyEmailChangePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gx-red border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailChangeContent />
    </Suspense>
  );
}
