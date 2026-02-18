import { NextResponse } from "next/server";
import { verifyEmailAction } from "@/lib/actions/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, code } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const result = await verifyEmailAction(email, code);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
