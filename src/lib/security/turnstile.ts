"use server";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verifies a Cloudflare Turnstile CAPTCHA token.
 *
 * If the `TURNSTILE_ENABLED` env var is not set to `"true"`, verification
 * is skipped and the function always returns `true` (useful for development).
 *
 * @param token - The turnstile response token submitted from the client.
 * @returns `true` if the token is valid (or Turnstile is disabled), `false` otherwise.
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  if (process.env.TURNSTILE_ENABLED !== "true") {
    return true;
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error(
      "TURNSTILE_SECRET_KEY is not set but TURNSTILE_ENABLED is true"
    );
    return false;
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = (await response.json()) as { success: boolean };
    return data.success === true;
  } catch (error) {
    console.error("Turnstile verification failed:", error);
    return false;
  }
}
