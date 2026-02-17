const TIMING_FIELD = "_timing";

/**
 * Creates a base64-encoded timestamp token to embed in forms.
 * Used to measure how quickly a form was submitted after being rendered.
 */
export function generateTimingToken(): string {
  const timestamp = Date.now().toString();
  return Buffer.from(timestamp).toString("base64");
}

/**
 * Validates that the form was not submitted faster than the minimum threshold.
 * Returns `true` if the submission timing appears human (took at least `minSeconds`).
 * Returns `false` if the submission was suspiciously fast or the token is missing/invalid.
 */
export function validateTiming(
  formData: FormData,
  minSeconds: number = 3
): boolean {
  const token = formData.get(TIMING_FIELD);

  if (!token || typeof token !== "string") {
    return false;
  }

  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const timestamp = parseInt(decoded, 10);

    if (isNaN(timestamp)) {
      return false;
    }

    const elapsedMs = Date.now() - timestamp;
    const elapsedSeconds = elapsedMs / 1000;

    return elapsedSeconds >= minSeconds;
  } catch {
    return false;
  }
}
