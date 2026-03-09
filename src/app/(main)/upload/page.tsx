import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { UploadForm } from "./upload-form";
import { MailCheck } from "lucide-react";

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true },
  });

  if (!user?.emailVerified) {
    return (
      <div className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 min-h-screen flex items-start justify-center">
        <div className="mx-auto max-w-md w-full mt-12">
          <div className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-sm p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20">
              <MailCheck className="h-6 w-6 text-yellow-500" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              Email Verification Required
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              You need to verify your email address before you can upload builds.
              Check your inbox for a verification link, or request a new one below.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/verify-email"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-gx-red text-white text-sm font-semibold hover:bg-gx-red/90 transition-colors"
              >
                Verify Email
              </Link>
              <Link
                href="/builds"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Browse builds instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <UploadForm />;
}
