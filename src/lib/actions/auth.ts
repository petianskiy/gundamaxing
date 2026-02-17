"use server";

import crypto from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/security/password";
import { signupSchema } from "@/lib/validations/auth";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email/send";
import { logEvent } from "@/lib/data/events";

// ─── Sign Up ──────────────────────────────────────────────────────

export async function signUpAction(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
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

    // Check email uniqueness
    const existingEmail = await db.user.findUnique({
      where: { email: email.toLowerCase() },
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

    // Check handle uniqueness (handle = username initially)
    const existingHandle = await db.user.findUnique({
      where: { handle: username.toLowerCase() },
    });
    if (existingHandle) {
      return { error: "This handle is already taken" };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        handle: username.toLowerCase(),
        passwordHash,
      },
    });

    // Generate verification token (24-hour expiry)
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
      },
    });

    // Send verification email
    await sendVerificationEmail(user.email, token);

    // Log event
    await logEvent("SIGNUP_SUCCESS", {
      userId: user.id,
      metadata: { email: user.email, username: user.username } as Record<string, unknown>,
    });

    return { success: true };
  } catch (error) {
    console.error("[signUpAction] Error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

// ─── Verify Email ─────────────────────────────────────────────────

export async function verifyEmailAction(
  token: string
): Promise<{ success: true } | { error: string }> {
  try {
    // Look up the token
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return { error: "Invalid or expired verification link" };
    }

    // Check expiry
    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await db.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      });
      return { error: "Verification link has expired. Please request a new one." };
    }

    // Find the user by the identifier (email)
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

    // Log event
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

// ─── Request Password Reset ──────────────────────────────────────

export async function requestPasswordResetAction(
  email: string
): Promise<{ success: true }> {
  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      // Generate token (1-hour expiry)
      const token = crypto.randomUUID();
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await db.verificationToken.create({
        data: {
          identifier: user.email,
          token,
          expires,
        },
      });

      // Send password reset email
      await sendPasswordResetEmail(user.email, token);

      // Log event
      await logEvent("PASSWORD_RESET_REQUESTED", {
        userId: user.id,
        metadata: { email: user.email } as Record<string, unknown>,
      });
    }

    // Always return success to avoid revealing whether email exists
    return { success: true };
  } catch (error) {
    console.error("[requestPasswordResetAction] Error:", error);
    // Still return success to avoid revealing information
    return { success: true };
  }
}

// ─── Reset Password ──────────────────────────────────────────────

export async function resetPasswordAction(
  token: string,
  newPassword: string
): Promise<{ success: true } | { error: string }> {
  try {
    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      return { error: "Password must be at least 8 characters" };
    }

    // Look up the token
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return { error: "Invalid or expired reset link" };
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
      return { error: "Reset link has expired. Please request a new one." };
    }

    // Find the user by the identifier (email)
    const user = await db.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Hash new password
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
    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    });

    // Log event
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
