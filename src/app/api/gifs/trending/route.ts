import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { getTrendingGifs } from "@/lib/klipy";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit(`gif:${session.user.id}`, 30, 60_000);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { gifs, hasNext } = await getTrendingGifs();

    return NextResponse.json(
      { gifs, hasNext },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
        },
      },
    );
  } catch (error) {
    console.error("[api/gifs/trending] Error:", error);
    return NextResponse.json({ error: "Failed to fetch GIFs" }, { status: 500 });
  }
}
