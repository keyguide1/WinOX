import { config } from "@/lib/config";
import { db } from "@/lib/db";

export const launchCheckKeys = [
  "COMPLIANCE_READY",
  "PAYMENT_PROVIDER_READY",
  "KYC_READY",
  "AGE_VERIFICATION_READY",
  "JURISDICTION_READY",
  "RESPONSIBLE_PLAY_READY",
  "SECURITY_READY",
  "ANTI_CHEAT_READY",
  "FRAUD_READY",
  "FINANCIAL_LEDGER_READY",
  "RECONCILIATION_READY",
  "WITHDRAWAL_READY",
  "MONITORING_READY",
  "BACKUP_READY",
  "DISASTER_RECOVERY_READY",
  "INCIDENT_RESPONSE_READY",
  "SUPPORT_READY",
  "TERMS_READY",
  "PRIVACY_READY",
] as const;

export async function evaluateLaunchGate() {
  const checks = await db.launchReadinessCheck.findMany({
    where: { key: { in: [...launchCheckKeys] } },
    orderBy: { key: "asc" },
  });
  const byKey = new Map(checks.map((check) => [check.key, check]));
  const blockers = launchCheckKeys.filter((key) => byKey.get(key)?.status !== "READY");
  const environmentAllowsMoney = config.realMoneyEnabled;

  return {
    mode: environmentAllowsMoney && blockers.length === 0 ? "REAL_MONEY" as const : "SANDBOX" as const,
    canActivate: environmentAllowsMoney && blockers.length === 0,
    environmentAllowsMoney,
    blockers,
    checks: launchCheckKeys.map((key) => ({
      key,
      status: byKey.get(key)?.status ?? "NOT_STARTED",
      owner: byKey.get(key)?.owner ?? null,
      evidenceRef: byKey.get(key)?.evidenceRef ?? null,
      lastVerifiedAt: byKey.get(key)?.lastVerifiedAt ?? null,
      expiresAt: byKey.get(key)?.expiresAt ?? null,
      notes: byKey.get(key)?.notes ?? null,
    })),
  };
}
