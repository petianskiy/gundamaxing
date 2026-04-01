import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { searchGifs } from "@/lib/klipy";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit(`gif:${session.user.id}`, 30, 60_000);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const term = req.nextUrl.searchParams.get("term")?.trim() ?? "";
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
    const query = term || "gundam";
    const { gifs, hasNext } = await searchGifs(query, page);

    return NextResponse.json(
      { gifs, hasNext },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
        },
      },
    );
  } catch (error) {
    console.error("[api/gifs/search] Error:", error);
    return NextResponse.json({ error: "Failed to search GIFs" }, { status: 500 });
  }
}
