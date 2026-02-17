import { resend, emailFrom } from "./client";
import { verificationEmailHtml, passwordResetEmailHtml } from "./templates/verification";

const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
  const subject = "Verify your email — GUNDAMAXING";
  const html = verificationEmailHtml(verifyUrl);

  if (!resend) {
    console.log("────────────────────────────────────────");
    console.log("[DEV] Verification Email");
    console.log(`  To:      ${email}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Link:    ${verifyUrl}`);
    console.log("────────────────────────────────────────");
    return;
  }

  const { error } = await resend.emails.send({
    from: emailFrom,
    to: email,
    subject,
    html,
  });

  if (error) {
    console.error("[Email] Failed to send verification email:", error);
    throw new Error("Failed to send verification email");
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  const subject = "Reset your password — GUNDAMAXING";
  const html = passwordResetEmailHtml(resetUrl);

  if (!resend) {
    console.log("────────────────────────────────────────");
    console.log("[DEV] Password Reset Email");
    console.log(`  To:      ${email}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Link:    ${resetUrl}`);
    console.log("────────────────────────────────────────");
    return;
  }

  const { error } = await resend.emails.send({
    from: emailFrom,
    to: email,
    subject,
    html,
  });

  if (error) {
    console.error("[Email] Failed to send password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
}
