"use server";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/security/password";
import { generateVerificationCode, hashToken } from "@/lib/security/token";
import { signupSchema } from "@/lib/validations/auth";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendEmailChangeVerification,
  sendEmailChangeNotification,
} from "@/lib/email/send";
import { logEvent } from "@/lib/data/events";
import { containsProfanity } from "@/lib/security/profanity";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { auth } from "@/lib/auth";

// ─── Sign Up ──────────────────────────────────────────────────────

export async function signUpAction(
  formData: FormData
): Promise<{ success: true; email: string; userId: string } | { error: string }> {
  try {
    const raw = {
      email: formData.get("email") as string,
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    };

    // Validate input
    const result = signupSchema.safeParse(raw);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message || "Invalid input";
      return { error: firstError };
    }

    const { email, username, password } = result.data;
    const normalizedEmail = email.toLowerCase();

    // Rate limit: 5 signups per hour per email
    const rl = await checkRateLimit(`signup:${normalizedEmail}`, 5, 60 * 60 * 1000);
    if (!rl.success) {
      return { error: "Too many signup attempts. Please try again later." };
    }

    // Check profanity in username
    if (containsProfanity(username)) {
      return { error: "This username contains inappropriate language and is not allowed." };
    }

    // Check email uniqueness
    const existingEmail = await db.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      return { error: "An account with this email already exists" };
    }

    // Check username uniqueness
    const existingUsername = await db.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (existingUsername) {
      return { error: "This username is already taken" };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with emailVerified: null — must verify via email
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        username: username.toLowerCase(),
        passwordHash,
        emailVerified: null,
      },
    });

    // Generate verification code (store hash, send raw)
    try {
      const code = generateVerificationCode();
      const hashedCode = hashToken(code);
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await db.verificationToken.create({
        data: {
          identifier: user.email,
          token: hashedCode,
          expires,
        },
      });

      await sendVerificationEmail(user.email, code);

      await logEvent("EMAIL_VERIFICATION_SENT", {
        userId: user.id,
        metadata: { email: user.email } as Record<string, unknown>,
      });
    } catch (emailError) {
      console.warn("[signUpAction] Email sending failed:", emailError);
    }

    // Log event
    await logEvent("SIGNUP_SUCCESS", {
      userId: user.id,
      metadata: { email: user.email, username: user.username } as Record<string, unknown>,
    });

    return { success: true, email: user.email, userId: user.id };
  } catch (error) {
    console.error("[signUpAction] Error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

// ─── Verify Email ─────────────────────────────────────────────────

export async function verifyEmailAction(
  email: string,
  code: string
): Promise<{ success: true } | { error: string }> {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit: 5 verification attempts per hour per email
    const rl = await checkRateLimit(`verify-email:${normalizedEmail}`, 5, 60 * 60 * 1000);
    if (!rl.success) {
      return { error: "Too many attempts. Please try again later." };
    }

    // Hash the incoming code to match DB
    const hashedCode = hashToken(code);

    const verificationToken = await db.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: normalizedEmail,
          token: hashedCode,
        },
      },
    });

    if (!verificationToken) {
      return { error: "Invalid verification code" };
    }

    // Check expiry
    if (verificationToken.expires < new Date()) {
      await db.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      });
      return { error: "Verification code has expired. Please request a new one." };
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Update user emailVerified
    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Delete the used token
    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    });

    await logEvent("EMAIL_VERIFICATION_COMPLETE", {
      userId: user.id,
      metadata: { email: user.email } as Record<string, unknown>,
    });

    return { success: true };
  } catch (error) {
    console.error("[verifyEmailAction] Error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

// ─── Resend Verification ─────────────────────────────────────────

export async function resendVerificationAction(
  email: string
): Promise<{ success: true }> {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit: 3 resends per hour per email
    const rl = await checkRateLimit(`resend-verify:${normalizedEmail}`, 3, 60 * 60 * 1000);
    if (!rl.success) {
      return { success: true }; // Don't reveal rate limit hit
    }

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, emailVerified: true },
    });

    if (user && !user.emailVerified) {
      // Delete old verification tokens for this user
      await db.verificationToken.deleteMany({
        where: { identifier: user.email },
      });

      // Create new code
      const code = generateVerificationCode();
      const hashedCode = hashToken(code);
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await db.verificationToken.create({
        data: {
          identifier: user.email,
          token: hashedCode,
          expires,
        },
      });

      await sendVerificationEmail(user.email, code);

      await logEvent("EMAIL_VERIFICATION_SENT", {
        userId: user.id,
        metadata: { email: user.email } as Record<string, unknown>,
      });
    }

    // Always return success to avoid email enumeration
    return { success: true };
  } catch (error) {
    console.error("[resendVerificationAction] Error:", error);
    return { success: true };
  }
}

// ─── Request Password Reset ──────────────────────────────────────

export async function requestPasswordResetAction(
  email: string
): Promise<{ success: true }> {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit: 3 per hour per email
    const rl = await checkRateLimit(`pw-reset:${normalizedEmail}`, 3, 60 * 60 * 1000);
    if (!rl.success) {
      return { success: true }; // Don't reveal rate limit hit
    }

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      // Delete existing password reset tokens for this user
      await db.passwordResetToken.deleteMany({
        where: { identifier: user.email },
      });

      // Generate code (1-hour expiry)
      const code = generateVerificationCode();
      const hashedCode = hashToken(code);
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await db.passwordResetToken.create({
        data: {
          identifier: user.email,
          token: hashedCode,
          expires,
        },
      });

      await sendPasswordResetEmail(user.email, code);

      await logEvent("PASSWORD_RESET_REQUESTED", {
        userId: user.id,
        metadata: { email: user.email } as Record<string, unknown>,
      });
    }

    // Always return success to avoid revealing whether email exists
    return { success: true };
  } catch (error) {
    console.error("[requestPasswordResetAction] Error:", error);
    return { success: true };
  }
}

// ─── Reset Password ──────────────────────────────────────────────

export async function resetPasswordAction(
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: true } | { error: string }> {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    if (!newPassword || newPassword.length < 8) {
      return { error: "Password must be at least 8 characters" };
    }

    // Rate limit: 5 reset attempts per hour per email
    const rl = await checkRateLimit(`pw-reset-verify:${normalizedEmail}`, 5, 60 * 60 * 1000);
    if (!rl.success) {
      return { error: "Too many attempts. Please try again later." };
    }

    // Hash incoming code to match DB
    const hashedCode = hashToken(code);

    const resetToken = await db.passwordResetToken.findUnique({
      where: {
        identifier_token: {
          identifier: normalizedEmail,
          token: hashedCode,
        },
      },
    });

    if (!resetToken) {
      return { error: "Invalid or expired reset code" };
    }

    if (resetToken.expires < new Date()) {
      await db.passwordResetToken.delete({
        where: {
          identifier_token: {
            identifier: resetToken.identifier,
            token: resetToken.token,
          },
        },
      });
      return { error: "Reset code has expired. Please request a new one." };
    }

    const user = await db.user.findUnique({
      where: { email: resetToken.identifier },
    });

    if (!user) {
      return { error: "User not found" };
    }

    const passwordHash = await hashPassword(newPassword);

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Delete all user sessions (force re-login)
    await db.session.deleteMany({
      where: { userId: user.id },
    });

    // Delete the used token
    await db.passwordResetToken.delete({
      where: {
        identifier_token: {
          identifier: resetToken.identifier,
          token: resetToken.token,
        },
      },
    });

    await logEvent("PASSWORD_RESET_COMPLETE", {
      userId: user.id,
      metadata: { email: user.email } as Record<string, unknown>,
    });

    return { success: true };
  } catch (error) {
    console.error("[resetPasswordAction] Error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

// ─── Request Email Change ────────────────────────────────────────

export async function requestEmailChangeAction(
  newEmail: string
): Promise<{ success: true } | { error: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Authentication required" };
    }

    const userId = session.user.id;
    const normalizedNewEmail = newEmail.toLowerCase().trim();

    // Rate limit: 3 per hour per user
    const rl = await checkRateLimit(`email-change:${userId}`, 3, 60 * 60 * 1000);
    if (!rl.success) {
      return { error: "Too many requests. Please try again later." };
    }

    // Check new email isn't already in use
    const existingUser = await db.user.findUnique({
      where: { email: normalizedNewEmail },
    });
    if (existingUser) {
      return { error: "This email is already associated with another account" };
    }

    // Get current user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) {
      return { error: "User not found" };
    }

    if (user.email === normalizedNewEmail) {
      return { error: "This is already your current email" };
    }

    // Delete existing email change tokens for this user
    await db.emailChangeToken.deleteMany({
      where: { identifier: user.email },
    });

    // Generate code (1-hour expiry)
    const code = generateVerificationCode();
    const hashedCode = hashToken(code);
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await db.emailChangeToken.create({
      data: {
        identifier: user.email,
        newEmail: normalizedNewEmail,
        token: hashedCode,
        expires,
      },
    });

    // Send verification to new email
    await sendEmailChangeVerification(normalizedNewEmail, code);

    // Send notification to old email
    await sendEmailChangeNotification(user.email, normalizedNewEmail);

    await logEvent("EMAIL_CHANGE_REQUESTED", {
      userId: user.id,
      metadata: { oldEmail: user.email, newEmail: normalizedNewEmail } as Record<string, unknown>,
    });

    return { success: true };
  } catch (error) {
    console.error("[requestEmailChangeAction] Error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

// ─── Verify Email Change ─────────────────────────────────────────

export async function verifyEmailChangeAction(
  newEmail: string,
  code: string
): Promise<{ success: true } | { error: string }> {
  try {
    const normalizedNewEmail = newEmail.toLowerCase().trim();

    // Rate limit: 5 verification attempts per hour per email
    const rl = await checkRateLimit(`email-change-verify:${normalizedNewEmail}`, 5, 60 * 60 * 1000);
    if (!rl.success) {
      return { error: "Too many attempts. Please try again later." };
    }

    const hashedCode = hashToken(code);

    // Look up by newEmail + hashed code
    const changeToken = await db.emailChangeToken.findFirst({
      where: {
        newEmail: normalizedNewEmail,
        token: hashedCode,
      },
    });

    if (!changeToken) {
      return { error: "Invalid or expired email change code" };
    }

    if (changeToken.expires < new Date()) {
      await db.emailChangeToken.delete({
        where: {
          identifier_token: {
            identifier: changeToken.identifier,
            token: changeToken.token,
          },
        },
      });
      return { error: "Email change code has expired. Please request a new one." };
    }

    // Check new email isn't taken (race condition guard)
    const existingUser = await db.user.findUnique({
      where: { email: changeToken.newEmail },
    });
    if (existingUser) {
      await db.emailChangeToken.delete({
        where: {
          identifier_token: {
            identifier: changeToken.identifier,
            token: changeToken.token,
          },
        },
      });
      return { error: "This email is now associated with another account" };
    }

    // Find the user by their current email
    const user = await db.user.findUnique({
      where: { email: changeToken.identifier },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Update email and mark as verified
    await db.user.update({
      where: { id: user.id },
      data: {
        email: changeToken.newEmail,
        emailVerified: new Date(),
      },
    });

    // Delete the used token
    await db.emailChangeToken.delete({
      where: {
        identifier_token: {
          identifier: changeToken.identifier,
          token: changeToken.token,
        },
      },
    });

    await logEvent("EMAIL_CHANGE_COMPLETE", {
      userId: user.id,
      metadata: { oldEmail: changeToken.identifier, newEmail: changeToken.newEmail } as Record<string, unknown>,
    });

    return { success: true };
  } catch (error) {
    console.error("[verifyEmailChangeAction] Error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
