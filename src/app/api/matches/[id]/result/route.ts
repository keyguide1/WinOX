import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiError, AppError } from "@/lib/errors";
import { baselineAntiCheatProvider } from "@/lib/anti-cheat";
import { recordRiskSignal, recordSecurityEvent } from "@/lib/security";

const resultSchema = z.object({
  score: z.number().int().min(0).max(1_000_000),
  evidenceUrl: z.string().url().optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AppError("UNAUTHORIZED", "You must be signed in.", 401);
    const parsed = resultSchema.safeParse(await request.json());
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid match result.", 400);
    const { id } = await context.params;

    const match = await db.match.findUnique({
      where: { id },
      include: { tournament: { include: { game: true, entries: { where: { userId: user.id } } } } },
    });
    if (!match) throw new AppError("NOT_FOUND", "Match not found.", 404);
    if (!match.tournament.entries.length) throw new AppError("FORBIDDEN", "You are not a participant in this match.", 403);
    if (!["PENDING", "IN_PROGRESS"].includes(match.status)) throw new AppError("FORBIDDEN", "This match cannot accept results.", 409);

    const existing = await db.matchResult.findUnique({ where: { matchId_submittedBy: { matchId: id, submittedBy: user.id } } });
    if (existing) throw new AppError("DUPLICATE_ENTRY", "You have already submitted a result.", 409);

    const signals = await baselineAntiCheatProvider.inspectResult({ gameSlug: match.tournament.game.slug, payload: parsed.data });
    for (const signal of signals) {
      await recordRiskSignal({ userId: user.id, matchId: id, tournamentId: match.tournamentId, type: signal.type, level: signal.severity, confidence: signal.confidence, metadata: signal.metadata });
      await recordSecurityEvent({ type: "CHEAT_SIGNAL_DETECTED", userId: user.id, metadata: { matchId: id, signal: signal.type } });
    }
    if (signals.some((signal) => signal.severity === "HIGH" || signal.severity === "CRITICAL")) {
      throw new AppError("FORBIDDEN", "This result requires review before it can be accepted.", 409);
    }

    const result = await db.matchResult.create({
      data: { matchId: id, submittedBy: user.id, payload: parsed.data, source: "SERVER" },
    });
    return NextResponse.json({ success: true, data: { result: { id: result.id, status: "PENDING_VERIFICATION" } } }, { status: 201 });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}
