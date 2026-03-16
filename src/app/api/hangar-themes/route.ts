import { NextResponse } from "next/server";
import { getPublishedThemes } from "@/lib/data/admin-themes";

export async function GET() {
  try {
    const themes = await getPublishedThemes();
    return NextResponse.json({ themes });
  } catch (error) {
    console.error("[GET /api/hangar-themes]", error);
    return NextResponse.json({ error: "Failed to fetch themes" }, { status: 500 });
  }
}
