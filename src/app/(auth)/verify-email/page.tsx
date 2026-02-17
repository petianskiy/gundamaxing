import { Suspense } from "react";
import { VerifyEmailContent } from "./verify-email-content";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gx-surface">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gx-red border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
