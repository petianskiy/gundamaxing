import { resend, emailFrom } from "./client";
import {
  verificationEmailHtml,
  passwordResetEmailHtml,
  emailChangeVerificationHtml,
  emailChangeNotificationHtml,
} from "./templates/verification";

export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<void> {
  const subject = "Verify your email — GUNDAMAXING";
  const html = verificationEmailHtml(code);

  if (!resend) {
    console.log("────────────────────────────────────────");
    console.log("[DEV] Verification Email");
    console.log(`  To:      ${email}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Code:    ${code}`);
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
  code: string
): Promise<void> {
  const subject = "Reset your password — GUNDAMAXING";
  const html = passwordResetEmailHtml(code);

  if (!resend) {
    console.log("────────────────────────────────────────");
    console.log("[DEV] Password Reset Email");
    console.log(`  To:      ${email}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Code:    ${code}`);
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

export async function sendEmailChangeVerification(
  email: string,
  code: string
): Promise<void> {
  const subject = "Verify your new email — GUNDAMAXING";
  const html = emailChangeVerificationHtml(code);

  if (!resend) {
    console.log("────────────────────────────────────────");
    console.log("[DEV] Email Change Verification");
    console.log(`  To:      ${email}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Code:    ${code}`);
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
    console.error("[Email] Failed to send email change verification:", error);
    throw new Error("Failed to send email change verification");
  }
}

export async function sendEmailChangeNotification(
  oldEmail: string,
  newEmail: string
): Promise<void> {
  const subject = "Email change requested — GUNDAMAXING";
  const html = emailChangeNotificationHtml(newEmail);

  if (!resend) {
    console.log("────────────────────────────────────────");
    console.log("[DEV] Email Change Notification");
    console.log(`  To:      ${oldEmail}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  New:     ${newEmail}`);
    console.log("────────────────────────────────────────");
    return;
  }

  const { error } = await resend.emails.send({
    from: emailFrom,
    to: oldEmail,
    subject,
    html,
  });

  if (error) {
    console.error("[Email] Failed to send email change notification:", error);
    throw new Error("Failed to send email change notification");
  }
}
