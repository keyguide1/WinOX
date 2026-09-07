import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { config } from "@/lib/config";

const sessionCookie = "winox_session";
const sessionDurationMs = 1000 * 60 * 60 * 24 * 30;

export function isSessionActive(
  session: { revokedAt: Date | null; expiresAt: Date },
  now = new Date(),
) {
  return !session.revokedAt && session.expiresAt > now;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, userAgent?: string, ip?: string) {
  const token = randomBytes(32).toString("hex");
  await db.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      userAgent,
      ipHash: ip ? hashToken(ip) : undefined,
      expiresAt: new Date(Date.now() + sessionDurationMs),
    },
  });
  const store = await cookies();
  store.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionDurationMs / 1000,
  });
}

export async function getCurrentUser() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || !isSessionActive(session)) return null;
  if (session.user.status !== "ACTIVE") return null;
  return session.user;
}

export async function revokeCurrentSession() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (token) await db.session.updateMany({ where: { tokenHash: hashToken(token), revokedAt: null }, data: { revokedAt: new Date() } });
  (await cookies()).delete(sessionCookie);
}

export async function listCurrentUserSessions() {
  const user = await getCurrentUser();
  if (!user) return null;
  const token = (await cookies()).get(sessionCookie)?.value;
  const currentHash = token ? hashToken(token) : "";
  return db.session.findMany({
    where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, userAgent: true, createdAt: true, lastSeenAt: true, expiresAt: true, tokenHash: true },
    orderBy: { lastSeenAt: "desc" },
  }).then((sessions) => sessions.map(({ tokenHash, ...session }) => ({ ...session, current: tokenHash === currentHash })));
}

export async function revokeSession(userId: string, sessionId: string) {
  return db.session.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: "USER_REVOKED" },
  });
}

export async function revokeAllSessions(userId: string) {
  return db.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: "USER_LOGOUT_ALL" },
  });
}

export function requireSessionSecret() {
  if (!config.sessionSecret) throw new Error("SESSION_SECRET is required for signed session operations.");
  return config.sessionSecret;
}
