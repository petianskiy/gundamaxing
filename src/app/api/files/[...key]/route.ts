import { NextRequest, NextResponse } from "next/server";
import { getR2Object } from "@/lib/upload/r2";

// Fallback proxy for /api/files/ URLs.
// When CDN is configured, redirects to CDN (302 so browsers don't cache permanently).
// Otherwise streams directly from R2.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: keySegments } = await params;
  const key = keySegments.join("/");

  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  // Redirect to CDN when available (302 = temporary, safe to change later)
  const cdnUrl = process.env.R2_PUBLIC_URL;
  if (cdnUrl) {
    return NextResponse.redirect(`${cdnUrl}/${key}`, 302);
  }

  // Fallback: stream from R2 directly
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
        "Cache-Control": "public, s-maxage=31536000, max-age=31536000, immutable",
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
