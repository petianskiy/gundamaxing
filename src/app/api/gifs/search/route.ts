import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { searchGifs } from "@/lib/klipy";

const ALLOWED_TERMS = new Set([
  "rx-78", "zaku", "char", "gunpla", "gundam wing", "uc", "seed", "00",
  "barbatos", "unicorn", "sinanju", "sazabi", "freedom", "exia", "aerial",
  "hg", "mg", "rg", "pg", "zeon", "federation", "mecha", "model kit",
  "panel line", "weathering", "custom build", "kitbash", "wing zero",
  "nu gundam", "strike", "destiny", "turn a", "iron blooded",
  "witch from mercury", "hathaway", "thunderbolt", "build fighters",
]);

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

    const term = req.nextUrl.searchParams.get("term")?.trim().toLowerCase() ?? "";

    // If a term is provided, it must be in the allowlist
    if (term && !ALLOWED_TERMS.has(term)) {
      return NextResponse.json(
        { error: "Search term not allowed. Use one of the suggested terms." },
        { status: 400 },
      );
    }

    const query = term ? `gundam ${term}` : "gundam";
    const { gifs, hasNext } = await searchGifs(query);

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
