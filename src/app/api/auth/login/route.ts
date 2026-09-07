import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { apiError, AppError } from "@/lib/errors";
import { createSession } from "@/lib/auth";
import { checkRateLimit, rateLimitPolicies } from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/lib/security";

const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  try {
    const address = request.headers.get("x-forwarded-for") ?? "unknown";
    const limit = await checkRateLimit(`login:${address}`, rateLimitPolicies.login);
    if (!limit.allowed) throw new AppError("FORBIDDEN", "Too many login attempts. Try again shortly.", 429);

    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Enter a valid email and password.");

    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError("FORBIDDEN", "This account is temporarily locked. Try again later.", 423);
    }
    const valid = user ? await verifyPassword(user.passwordHash, parsed.data.password) : false;
    if (!user || !valid) {
      if (user) {
        const failedLoginCount = user.failedLoginCount + 1;
        await db.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount,
            lockedUntil: failedLoginCount >= 5 ? new Date(Date.now() + Math.min(failedLoginCount - 4, 6) * 60_000) : null,
          },
        });
        await recordSecurityEvent({ type: "LOGIN_FAILED", userId: user.id, metadata: { failedLoginCount } });
      }
      throw new AppError("UNAUTHORIZED", "Email or password is incorrect.", 401);
    }
    if (user.status !== "ACTIVE") throw new AppError("FORBIDDEN", "This account is currently restricted.", 403);

    await db.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() } });
    await recordSecurityEvent({ type: "SESSION_CREATED", userId: user.id });
    await createSession(user.id, request.headers.get("user-agent") ?? undefined, address);
    return NextResponse.json({ success: true, data: { user: { id: user.id, email: user.email, displayName: user.displayName } } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}
