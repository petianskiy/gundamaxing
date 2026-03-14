import { NextRequest, NextResponse } from "next/server";
import { getR2Object } from "@/lib/upload/r2";
import sharp from "sharp";

// Stream files from R2 with aggressive caching and on-the-fly resizing.
// Each upload key is unique (timestamp + random), so the content is immutable.
//
// Query params (optional):
//   ?w=800   — max width (default: 1920)
//   ?q=75    — quality 1-100 (default: 80)
//   ?f=webp  — format: webp | avif | jpeg (default: auto based on Accept header)

const MAX_WIDTH = 1920;
const DEFAULT_QUALITY = 80;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: keySegments } = await params;
  const key = keySegments.join("/");

  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  try {
    const object = await getR2Object(key);

    if (!object.Body) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const contentType = object.ContentType || "application/octet-stream";
    const isImage = contentType.startsWith("image/") && !contentType.includes("svg");

    // Non-image files: stream as-is
    if (!isImage) {
      const stream = object.Body.transformToWebStream();
      return new NextResponse(stream, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": object.ContentLength?.toString() || "",
          "Cache-Control": "public, max-age=31536000, immutable",
          "ETag": object.ETag || "",
        },
      });
    }

    // Image files: resize and convert format
    const url = new URL(req.url);
    const requestedWidth = Math.min(
      parseInt(url.searchParams.get("w") || String(MAX_WIDTH), 10) || MAX_WIDTH,
      MAX_WIDTH,
    );
    const quality = Math.min(
      parseInt(url.searchParams.get("q") || String(DEFAULT_QUALITY), 10) || DEFAULT_QUALITY,
      100,
    );

    // Pick best output format based on Accept header
    const accept = req.headers.get("accept") || "";
    let format: "webp" | "avif" | "jpeg" = "jpeg";
    if (accept.includes("image/avif")) {
      format = "avif";
    } else if (accept.includes("image/webp")) {
      format = "webp";
    }

    const inputBytes = await object.Body.transformToByteArray();

    let pipeline = sharp(Buffer.from(inputBytes))
      .resize({ width: requestedWidth, withoutEnlargement: true });

    if (format === "avif") {
      pipeline = pipeline.avif({ quality });
    } else if (format === "webp") {
      pipeline = pipeline.webp({ quality });
    } else {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    }

    const outputBuffer = await pipeline.toBuffer();

    const mimeTypes = { webp: "image/webp", avif: "image/avif", jpeg: "image/jpeg" };

    return new NextResponse(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        "Content-Type": mimeTypes[format],
        "Content-Length": outputBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Vary": "Accept",
      },
    });
  } catch (err: any) {
    if (err?.name === "NoSuchKey" || err?.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[files] Error fetching from R2:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
