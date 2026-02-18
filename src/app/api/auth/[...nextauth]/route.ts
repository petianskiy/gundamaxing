import { handlers } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { getClientIp } from "@/lib/security/ip-utils";
import { logEvent } from "@/lib/data/events";
import { NextRequest, NextResponse } from "next/server";

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000; // 1 minute

async function withRateLimit(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
): Promise<Response> {
  const ip = getClientIp(req.headers) ?? "unknown";
  const result = await checkRateLimit(`auth:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);

  if (!result.success) {
    await logEvent("RATE_LIMIT_HIT", {
      ipAddress: ip,
      metadata: { endpoint: "auth", remaining: result.remaining },
    });
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": "60" },
      }
    );
  }

  return handler(req);
}

export async function GET(req: NextRequest) {
  return withRateLimit(req, handlers.GET);
}

export async function POST(req: NextRequest) {
  return withRateLimit(req, handlers.POST);
}
