import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { checkBanned } from "@/lib/security/ban-check";
import { detectText } from "@/lib/ocr/vision-client";
import { parseCardFields } from "@/lib/ocr/card-parser";
import { validateAndClean } from "@/lib/ocr/field-validator";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    // Auth
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const banError = await checkBanned(session.user.id);
    if (banError) {
      return NextResponse.json({ error: banError }, { status: 403 });
    }

    // Rate limit: 20 scans per minute
    const rl = await checkRateLimit(`card:scan:${session.user.id}`, 20, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many scan requests. Please wait a moment." }, { status: 429 });
    }

    // Parse body
    const body = await req.json();
    const { imageBase64, imageWidth, imageHeight } = body as {
      imageBase64: string;
      imageWidth: number;
      imageHeight: number;
    };

    if (!imageBase64 || !imageWidth || !imageHeight) {
      return NextResponse.json({ error: "Missing imageBase64, imageWidth, or imageHeight" }, { status: 400 });
    }

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // Size check (base64 is ~33% larger than binary)
    if (base64Data.length * 0.75 > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image too large (max 10MB)" }, { status: 400 });
    }

    // ── OCR Pass 1: Standard detection ──
    const vision = await detectText(base64Data);

    if (vision.words.length === 0) {
      return NextResponse.json({
        error: "No text detected on the card. Try a clearer image with better lighting.",
      }, { status: 422 });
    }

    const rawFields = parseCardFields(vision, imageWidth, imageHeight);
    let result = validateAndClean(rawFields);

    // ── OCR Pass 2: If cardId confidence is low, retry with just the top-right crop hint ──
    if (result.fields.cardId.confidence < 0.6) {
      // Re-parse with more aggressive cardId extraction from full text
      const fullTextMatch = vision.fullText.match(/[A-Z]{1,5}\d{1,3}[-–]\d{2,4}/g);
      if (fullTextMatch && fullTextMatch.length > 0) {
        const bestId = fullTextMatch[0].replace("–", "-");
        if (bestId.length > (result.fields.cardId.value?.length ?? 0)) {
          result = {
            ...result,
            fields: {
              ...result.fields,
              cardId: { value: bestId, confidence: 0.7 },
            },
          };
        }
      }
    }

    return NextResponse.json({
      result,
      debug: process.env.NODE_ENV === "development" ? {
        fullText: vision.fullText,
        wordCount: vision.words.length,
        rawFields,
      } : undefined,
    });
  } catch (error) {
    console.error("scan-card error:", error);
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
