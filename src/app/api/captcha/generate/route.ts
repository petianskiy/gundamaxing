import { NextRequest, NextResponse } from "next/server";
import { generateChallenge, generateTextChallenge } from "@/lib/captcha/generator";

// ---- In-memory rate limiter ----

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before requesting a new challenge." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  try {
    if (mode === "text") {
      const challenge = await generateTextChallenge();
      return NextResponse.json(challenge);
    }

    const challenge = await generateChallenge();
    return NextResponse.json(challenge);
  } catch (error) {
    console.error("[CAPTCHA] Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate challenge" },
      { status: 500 }
    );
  }
}
