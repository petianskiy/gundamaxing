import { NextRequest, NextResponse } from "next/server";
import { verifyCaptcha } from "@/lib/captcha/verifier";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challengeId, selectedId } = body as {
      challengeId?: string;
      selectedId?: string;
    };

    if (!challengeId || !selectedId) {
      return NextResponse.json(
        { valid: false, error: "Missing challengeId or selectedId" },
        { status: 400 }
      );
    }

    const result = await verifyCaptcha(challengeId, selectedId);

    return NextResponse.json({ valid: result.valid });
  } catch (error) {
    console.error("[CAPTCHA] Verification error:", error);
    return NextResponse.json(
      { valid: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
