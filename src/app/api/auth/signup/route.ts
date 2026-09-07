import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { apiError, AppError } from "@/lib/errors";
import { createSession } from "@/lib/auth";
import { checkRateLimit, rateLimitPolicies } from "@/lib/rate-limit";

const signupSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_ -]+$/),
});

export async function POST(request: Request) {
  try {
    const address = request.headers.get("x-forwarded-for") ?? "unknown";
    if (!(await checkRateLimit(`signup:${address}`, rateLimitPolicies.signup)).allowed) {
      throw new AppError("FORBIDDEN", "Too many signup attempts. Try again shortly.", 429);
    }
    const parsed = signupSchema.safeParse(await request.json());
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Enter a valid email, password, and display name.");

    const existing = await db.user.findFirst({
      where: { OR: [{ email: parsed.data.email }, { displayName: parsed.data.displayName }] },
      select: { id: true },
    });
    if (existing) throw new AppError("VALIDATION_ERROR", "That email or display name is already in use.");

    const user = await db.user.create({
      data: {
        email: parsed.data.email,
        displayName: parsed.data.displayName,
        passwordHash: await hashPassword(parsed.data.password),
        wallet: { create: { currency: "GHS" } },
      },
      select: { id: true, email: true, displayName: true },
    });

    await createSession(user.id, request.headers.get("user-agent") ?? undefined);
    return NextResponse.json({ success: true, data: { user } }, { status: 201 });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}
