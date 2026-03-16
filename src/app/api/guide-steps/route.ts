import { NextResponse } from "next/server";
import { getActiveGuideSteps } from "@/lib/data/admin-guide";

export async function GET() {
  const steps = await getActiveGuideSteps();
  return NextResponse.json(steps);
}
