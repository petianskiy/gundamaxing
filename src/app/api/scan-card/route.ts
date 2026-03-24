import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { checkBanned } from "@/lib/security/ban-check";
import { detectText, inferCardBounds } from "@/lib/ocr/vision-client";
import { parseCardFields } from "@/lib/ocr/card-parser";
import { validateAndClean } from "@/lib/ocr/field-validator";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const banError = await checkBanned(session.user.id);
    if (banError) {
      return NextResponse.json({ error: banError }, { status: 403 });
    }

    const rl = await checkRateLimit(`card:scan:${session.user.id}`, 20, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many scan requests. Please wait a moment." }, { status: 429 });
    }

    const body = await req.json();
    const { imageBase64, imageWidth, imageHeight } = body as {
      imageBase64: string;
      imageWidth: number;
      imageHeight: number;
    };

    if (!imageBase64 || !imageWidth || !imageHeight) {
      return NextResponse.json({ error: "Missing imageBase64, imageWidth, or imageHeight" }, { status: 400 });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    if (base64Data.length * 0.75 > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image too large (max 10MB)" }, { status: 400 });
    }

    // ── Run Vision API ──
    const vision = await detectText(base64Data);

    if (vision.words.length === 0) {
      return NextResponse.json({
        error: "No text detected. Try a clearer image with better lighting.",
      }, { status: 422 });
    }

    // ── Infer card boundaries from text positions ──
    const cardBounds = inferCardBounds(vision.annotations, imageWidth, imageHeight);

    // Parse using card bounds (if found, offset words to card-relative coordinates)
    let parseW = imageWidth;
    let parseH = imageHeight;
    let adjustedWords = vision.words;

    if (cardBounds) {
      // Offset all word bounding boxes relative to the card crop
      parseW = cardBounds.width;
      parseH = cardBounds.height;
      adjustedWords = vision.words.map((w) => ({
        ...w,
        boundingBox: {
          x: w.boundingBox.x - cardBounds.x,
          y: w.boundingBox.y - cardBounds.y,
          width: w.boundingBox.width,
          height: w.boundingBox.height,
        },
      }));
    }

    const adjustedVision = { ...vision, words: adjustedWords };
    const rawFields = parseCardFields(adjustedVision, parseW, parseH);
    let result = validateAndClean(rawFields);

    // Fallback: aggressive cardId search in full text
    if (result.fields.cardId.confidence < 0.6) {
      const matches = vision.fullText.match(/[A-Z]{1,5}\d{1,3}[-–]\d{2,4}/g);
      if (matches && matches.length > 0) {
        const bestId = matches[0].replace("–", "-");
        result = {
          ...result,
          fields: { ...result.fields, cardId: { value: bestId, confidence: 0.7 } },
        };
      }
    }

    return NextResponse.json({
      result,
      cardBounds,
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
