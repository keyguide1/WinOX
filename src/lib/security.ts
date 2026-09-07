import type { Prisma, RiskLevel, SecurityEventType } from "@prisma/client";
import { db } from "@/lib/db";

export async function recordSecurityEvent(input: {
  type: SecurityEventType;
  userId?: string;
  requestId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return db.securityEvent.create({ data: input });
}

export async function recordRiskSignal(input: {
  type: string;
  level: RiskLevel;
  confidence: string | number;
  userId?: string;
  matchId?: string;
  tournamentId?: string;
  evidenceRef?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return db.riskSignal.create({ data: { ...input, confidence: input.confidence } });
}

export function calculateRiskDecision(level: RiskLevel) {
  if (level === "CRITICAL") return "REVIEW" as const;
  if (level === "HIGH") return "CHALLENGE" as const;
  if (level === "MEDIUM") return "MONITOR" as const;
  return "ALLOW" as const;
}
