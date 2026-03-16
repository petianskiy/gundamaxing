import { NextResponse } from "next/server";
import { getActiveCustomTemplates } from "@/lib/data/admin-templates";

export async function GET() {
  try {
    const templates = await getActiveCustomTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("[GET /api/custom-templates]", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}
