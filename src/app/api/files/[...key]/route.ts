import { NextRequest, NextResponse } from "next/server";
import { getR2Object } from "@/lib/upload/r2";

// Serve files from R2 by streaming directly with aggressive caching.
// This is the fallback proxy — the DAL layer rewrites URLs to CDN when available.
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

    const stream = object.Body.transformToWebStream();

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": object.ContentType || "application/octet-stream",
        "Content-Length": object.ContentLength?.toString() || "",
        // s-maxage tells Vercel's edge CDN to cache this response.
        // stale-while-revalidate serves cached version while refreshing in background.
        // Each R2 key is unique (timestamp+random), so content is immutable.
        "Cache-Control": "public, s-maxage=31536000, max-age=31536000, stale-while-revalidate=31536000, immutable",
        "ETag": object.ETag || "",
        "CDN-Cache-Control": "public, max-age=31536000, immutable",
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
