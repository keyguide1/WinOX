import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/errors";
import { requireAdmin } from "@/lib/admin";

const restrictionSchema = z.object({ reason: z.string().trim().min(5).max(500) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin("RESTRICT_PLAYER");
    const parsed = restrictionSchema.safeParse(await request.json());
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "A restriction reason is required.");
    const { id } = await context.params;
    const player = await db.user.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!player) throw new AppError("NOT_FOUND", "Player not found.", 404);
    if (player.id === admin.id) throw new AppError("FORBIDDEN", "You cannot restrict your own account.", 403);
    if (player.status === "SUSPENDED") throw new AppError("FORBIDDEN", "This account is already suspended.", 409);

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.user.update({ where: { id }, data: { status: "RESTRICTED" }, select: { id: true, status: true } });
      await tx.auditEvent.create({
        data: {
          actorId: admin.id,
          action: "PLAYER_RESTRICTED",
          targetId: id,
          metadata: { reason: parsed.data.reason, previousStatus: player.status, newStatus: result.status },
        },
      });
      return result;
    });
    return NextResponse.json({ success: true, data: { player: updated } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}
