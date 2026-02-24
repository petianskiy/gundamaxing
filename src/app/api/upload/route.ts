import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPresignedUploadUrl, generateKey, getProxyUrl } from "@/lib/upload/r2";
import { getLimitsForTier } from "@/lib/upload/limits";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { filename, contentType, type } = body as {
      filename: string;
      contentType: string;
      type: "image" | "video";
    };

    if (!filename || !contentType || !type) {
      return NextResponse.json(
        { error: "Missing required fields: filename, contentType, type" },
        { status: 400 },
      );
    }

    const limits = getLimitsForTier(); // Default tier for now

    // Validate content type
    if (type === "image" && !contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid image content type" }, { status: 400 });
    }
    if (type === "video" && !contentType.startsWith("video/")) {
      return NextResponse.json({ error: "Invalid video content type" }, { status: 400 });
    }

    const maxSize = type === "image" ? limits.maxImageSize : limits.maxVideoSize;
    const key = generateKey(type, session.user.id, filename);
    const presignedUrl = await getPresignedUploadUrl(key, contentType);
    // Stable proxy URL — stored in DB, served by /api/files/[...key]
    const url = getProxyUrl(key);

    return NextResponse.json({
      presignedUrl,
      url,
      key,
      limits: {
        maxSize,
        maxDuration: type === "video" ? limits.maxVideoDuration : undefined,
      },
    });
  } catch (error) {
    console.error("[upload] Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
