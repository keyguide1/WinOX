import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";

export async function GET() {
  try {
    const games = await db.game.findMany({
      where: { enabled: true },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        versions: {
          select: { version: true, rules: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { tournaments: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: { games } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}
