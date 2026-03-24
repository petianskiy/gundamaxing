import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { checkBanned } from "@/lib/security/ban-check";
import { detectText, inferCardBounds } from "@/lib/ocr/vision-client";
import { loadBase64Image, cropCardFromFrame, canvasToBase64 } from "@/lib/ocr/image-preprocessor";
import { parseCard } from "@/lib/ocr/card-parser";
import { validateAndClean } from "@/lib/ocr/field-validator";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const banError = await checkBanned(session.user.id);
    if (banError) return NextResponse.json({ error: banError }, { status: 403 });

    const rl = await checkRateLimit(`card:scan:${session.user.id}`, 20, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many scan requests. Please wait." }, { status: 429 });
    }

    // ── Parse input ──
    const body = await req.json();
    const { imageBase64, imageWidth, imageHeight } = body as {
      imageBase64: string;
      imageWidth: number;
      imageHeight: number;
    };

    if (!imageBase64 || !imageWidth || !imageHeight) {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    if (base64Data.length * 0.75 > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image too large (max 10MB)" }, { status: 400 });
    }

    // ══════════════════════════════════════════════════════
    // STAGE 2: DETECT — find card in the frame
    // ══════════════════════════════════════════════════════

    // Coarse OCR on full frame to find text positions
    const coarseVision = await detectText(base64Data);

    if (coarseVision.words.length < 3) {
      return NextResponse.json({
        error: "No card text detected. Try better lighting or hold the card closer.",
      }, { status: 422 });
    }

    // Infer card boundaries from text annotation positions
    const cardBounds = inferCardBounds(coarseVision.annotations, imageWidth, imageHeight);

    // ══════════════════════════════════════════════════════
    // STAGE 3: PREPROCESS — crop card, normalize
    // ══════════════════════════════════════════════════════

    let cardCanvas;
    let cardW: number;
    let cardH: number;
    let cardBase64: string;

    if (cardBounds) {
      const cropped = await cropCardFromFrame(base64Data, cardBounds);
      cardCanvas = cropped.canvas;
      cardW = cropped.width;
      cardH = cropped.height;
      cardBase64 = cropped.base64;
    } else {
      // Fallback: use full image
      const loaded = await loadBase64Image(base64Data);
      cardCanvas = loaded.canvas;
      cardW = loaded.width;
      cardH = loaded.height;
      cardBase64 = base64Data;
    }

    // ══════════════════════════════════════════════════════
    // STAGE 4: EXTRACT — template-based multi-zone OCR
    // ══════════════════════════════════════════════════════

    const parsed = await parseCard(cardCanvas, cardW, cardH, coarseVision);

    // ══════════════════════════════════════════════════════
    // STAGE 5: VALIDATE — domain rules, confidence scoring
    // ══════════════════════════════════════════════════════

    const result = validateAndClean(parsed);

    return NextResponse.json({
      result,
      cardBounds,
      cardImageBase64: cardBase64 ? `data:image/jpeg;base64,${cardBase64}` : null,
      debug: process.env.NODE_ENV === "development" ? {
        fullText: coarseVision.fullText,
        wordCount: coarseVision.words.length,
        parsedRaw: parsed,
      } : undefined,
    });
  } catch (error) {
    console.error("scan-card error:", error);
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
