import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiError, AppError } from "@/lib/errors";
import { config } from "@/lib/config";

const createSchema = z.object({
  gameId: z.string().uuid(),
  name: z.string().trim().min(3).max(80),
  capacity: z.number().int().min(2).max(config.tournament.maxCapacity),
  startsAt: z.coerce.date(),
  rules: z.custom<Prisma.InputJsonValue>().default({}),
});

export async function GET() {
  const tournaments = await db.tournament.findMany({
    where: { status: "OPEN", startsAt: { gte: new Date() } },
    include: { game: { select: { slug: true, name: true } }, _count: { select: { entries: true } } },
    orderBy: { startsAt: "asc" },
  });
  return NextResponse.json({ success: true, data: { tournaments } });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AppError("UNAUTHORIZED", "You must be signed in.", 401);
    if (user.role === "PLAYER") throw new AppError("FORBIDDEN", "Only authorized organizers can create tournaments.", 403);
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid tournament configuration.");
    const game = await db.game.findUnique({ where: { id: parsed.data.gameId }, select: { id: true } });
    if (!game) throw new AppError("NOT_FOUND", "Game not found.", 404);

    const tournament = await db.tournament.create({ data: { ...parsed.data, status: "OPEN" } });
    return NextResponse.json({ success: true, data: { tournament } }, { status: 201 });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}
