import { NextResponse } from "next/server";
import { getCurrentUser, revokeSession } from "@/lib/auth";
import { apiError, AppError } from "@/lib/errors";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AppError("UNAUTHORIZED", "You must be signed in.", 401);
    const { id } = await context.params;
    const result = await revokeSession(user.id, id);
    if (result.count === 0) throw new AppError("NOT_FOUND", "Session not found.", 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}
