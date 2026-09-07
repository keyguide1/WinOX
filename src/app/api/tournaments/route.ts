import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiError, AppError } from "@/lib/errors";
import { paginationSchema, tournamentConfigSchema } from "@/lib/validation";

const createSchema = tournamentConfigSchema.extend({
  rules: z.custom<Prisma.InputJsonValue>().default({}),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pagination = paginationSchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });
    if (!pagination.success) throw new AppError("VALIDATION_ERROR", "Invalid pagination.");

    const gameId = url.searchParams.get("gameId");
    if (gameId && !z.string().uuid().safeParse(gameId).success) {
      throw new AppError("VALIDATION_ERROR", "Invalid game ID.");
    }

    const { page, pageSize } = pagination.data;
    const where = {
      status: "OPEN" as const,
      startsAt: { gte: new Date() },
      ...(gameId ? { gameId } : {}),
    };
    const [tournaments, total] = await db.$transaction([
      db.tournament.findMany({
        where,
        select: {
          id: true,
          name: true,
          capacity: true,
          startsAt: true,
          status: true,
          game: { select: { id: true, slug: true, name: true } },
          _count: { select: { entries: true } },
        },
        orderBy: { startsAt: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.tournament.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { tournaments, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } },
    });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AppError("UNAUTHORIZED", "You must be signed in.", 401);
    if (user.role === "PLAYER") throw new AppError("FORBIDDEN", "Only authorized organizers can create tournaments.", 403);
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid tournament configuration.");
    const game = await db.game.findUnique({ where: { id: parsed.data.gameId }, select: { id: true, enabled: true } });
    if (!game || !game.enabled) throw new AppError("NOT_FOUND", "Game not found.", 404);

    const tournament = await db.tournament.create({
      data: { ...parsed.data, createdById: user.id, status: "OPEN" },
    });
    return NextResponse.json({ success: true, data: { tournament } }, { status: 201 });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}
