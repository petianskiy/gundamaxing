import { NextResponse } from "next/server";
import { requestPasswordResetAction } from "@/lib/actions/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const { email } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  await requestPasswordResetAction(email);

  // Always return success to avoid email enumeration
  return NextResponse.json({ success: true });
}
