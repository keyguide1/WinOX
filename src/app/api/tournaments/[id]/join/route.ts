import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/errors";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AppError("UNAUTHORIZED", "You must be signed in.", 401);
    const { id } = await context.params;
    const entry = await db.$transaction(async (tx) => {
      const tournament = await tx.tournament.findUnique({ where: { id } });
      if (!tournament || tournament.status !== "OPEN") throw new AppError("NOT_FOUND", "Tournament is not open.", 404);
      const existing = await tx.tournamentEntry.findUnique({ where: { tournamentId_userId: { tournamentId: id, userId: user.id } } });
      if (existing) throw new AppError("DUPLICATE_ENTRY", "You are already registered.", 409);
      const count = await tx.tournamentEntry.count({ where: { tournamentId: id } });
      if (count >= tournament.capacity) throw new AppError("TOURNAMENT_FULL", "This tournament is full.", 409);
      return tx.tournamentEntry.create({ data: { tournamentId: id, userId: user.id } });
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ success: true, data: { entry } }, { status: 201 });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}
