import { NextRequest, NextResponse } from "next/server";
import { getR2Object } from "@/lib/upload/r2";

// Stream files from R2 with aggressive caching.
// Each upload key is unique (timestamp + random), so the content is immutable.
export async function GET(
  _req: NextRequest,
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

    // Convert the SDK stream to a web ReadableStream
    const stream = object.Body.transformToWebStream();

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": object.ContentType || "application/octet-stream",
        "Content-Length": object.ContentLength?.toString() || "",
        "Cache-Control": "public, max-age=31536000, immutable",
        "ETag": object.ETag || "",
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
