import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiError, AppError } from "@/lib/errors";
import { checkRateLimit, rateLimitPolicies } from "@/lib/rate-limit";
import { idSchema } from "@/lib/validation";

const updateSchema = z.object({
  name: z.string().trim().min(3).max(80).optional(),
  capacity: z.number().int().min(2).max(10_000).optional(),
  startsAt: z.coerce.date().refine((date) => date.getTime() > Date.now(), "Tournament must start in the future.").optional(),
  rules: z.custom<Prisma.InputJsonValue>().optional(),
  status: z.enum(["OPEN", "CANCELLED"]).optional(),
}).strict();

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    if (!idSchema.safeParse(id).success) throw new AppError("VALIDATION_ERROR", "Invalid tournament ID.");
    const tournament = await db.tournament.findFirst({
      where: { id, status: "OPEN", startsAt: { gte: new Date() } },
      select: {
        id: true,
        name: true,
        rules: true,
        capacity: true,
        startsAt: true,
        status: true,
        createdAt: true,
        game: { select: { id: true, slug: true, name: true, description: true } },
        organizer: { select: { id: true, displayName: true } },
        _count: { select: { entries: true, matches: true } },
      },
    });
    if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found.", 404);
    return NextResponse.json({ success: true, data: { tournament } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AppError("UNAUTHORIZED", "You must be signed in.", 401);
    if (!(await checkRateLimit(`tournament-manage:${user.id}`, rateLimitPolicies.admin)).allowed) {
      throw new AppError("RATE_LIMITED", "Too many management requests. Try again shortly.", 429);
    }
    const { id } = await context.params;
    if (!idSchema.safeParse(id).success) throw new AppError("VALIDATION_ERROR", "Invalid tournament ID.");
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid tournament update.");

    const tournament = await db.tournament.findUnique({
      where: { id },
      select: { id: true, createdById: true, capacity: true, status: true, startsAt: true },
    });
    if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found.", 404);
    const canManage = user.role === "ADMIN" || user.role === "MODERATOR" || tournament.createdById === user.id;
    if (!canManage) throw new AppError("FORBIDDEN", "You cannot manage this tournament.", 403);
    if (tournament.status !== "OPEN") throw new AppError("FORBIDDEN", "Only open tournaments can be updated.", 409);

    const updated = await db.$transaction(async (tx) => {
      const entries = await tx.tournamentEntry.count({ where: { tournamentId: id } });
      if (parsed.data.capacity !== undefined && parsed.data.capacity < entries) {
        throw new AppError("VALIDATION_ERROR", "Capacity cannot be below current entries.");
      }
      return tx.tournament.update({
        where: { id },
        data: parsed.data,
        select: { id: true, name: true, capacity: true, startsAt: true, status: true, rules: true },
      });
    }, { isolationLevel: "Serializable" }).catch((error: unknown) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        throw new AppError("TOURNAMENT_BUSY", "Tournament update is busy. Try again shortly.", 409);
      }
      throw error;
    });
    return NextResponse.json({ success: true, data: { tournament: updated } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}
