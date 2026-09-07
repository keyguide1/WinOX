import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { checkRateLimit, rateLimitPolicies } from "@/lib/rate-limit";

export const adminPermissions = [
  "VIEW_DASHBOARD",
  "VIEW_PLAYERS",
  "MANAGE_PLAYERS",
  "RESTRICT_PLAYER",
  "VIEW_TOURNAMENTS",
  "MANAGE_TOURNAMENTS",
  "VIEW_MATCHES",
  "REVIEW_MATCH",
  "VIEW_SECURITY",
  "VIEW_RISK_CASES",
  "VIEW_AUDIT_LOGS",
] as const;

export type AdminPermission = (typeof adminPermissions)[number];

const rolePermissions: Record<string, readonly AdminPermission[]> = {
  ADMIN: adminPermissions,
};

export async function requireAdmin(permission: AdminPermission) {
  const user = await getCurrentUser();
  if (!user) throw new AppError("UNAUTHORIZED", "You must be signed in.", 401);
  if (!(await checkRateLimit(`admin:${user.id}`, rateLimitPolicies.admin)).allowed) {
    throw new AppError("FORBIDDEN", "Too many administrative requests. Try again shortly.", 429);
  }
  const permissions = rolePermissions[user.role] ?? [];
  if (!permissions.includes(permission)) {
    throw new AppError("FORBIDDEN", "You do not have permission to perform this action.", 403);
  }
  return user;
}

export async function writeAdminAudit(input: {
  actorId: string;
  action: string;
  targetId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  return db.auditEvent.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetId: input.targetId,
      metadata: input.metadata,
    },
  });
}
