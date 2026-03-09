import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate-limit: skip if updated less than 60s ago
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { lastActiveAt: true },
  });

  if (user?.lastActiveAt) {
    const elapsed = Date.now() - user.lastActiveAt.getTime();
    if (elapsed < 60_000) {
      return NextResponse.json({ ok: true });
    }
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { lastActiveAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
