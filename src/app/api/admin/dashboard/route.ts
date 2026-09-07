import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  try {
    await requireAdmin("VIEW_DASHBOARD");
    const [players, activePlayers, tournaments, activeMatches, pendingResults, riskCases, securityEvents] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { status: "ACTIVE", lastLoginAt: { not: null } } }),
      db.tournament.groupBy({ by: ["status"], _count: { _all: true } }),
      db.match.count({ where: { status: "IN_PROGRESS" } }),
      db.matchResult.count({ where: { verifiedAt: null } }),
      db.riskCase.count({ where: { status: { notIn: ["RESOLVED", "CLOSED"] } } }),
      db.securityEvent.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        players: { total: players, active: activePlayers },
        competition: {
          tournaments: Object.fromEntries(tournaments.map((item) => [item.status.toLowerCase(), item._count._all])),
          activeMatches,
          pendingResults,
        },
        security: { openRiskCases: riskCases, eventsLast24Hours: securityEvents },
        finance: { available: false, message: "Financial controls are unavailable while real-money operations are disabled." },
      },
    });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}
