import { NextResponse } from "next/server";
import { getCurrentUser, listCurrentUserSessions, revokeAllSessions } from "@/lib/auth";
import { apiError, AppError } from "@/lib/errors";

export async function GET() {
  try {
    if (!(await getCurrentUser())) throw new AppError("UNAUTHORIZED", "You must be signed in.", 401);
    return NextResponse.json({ success: true, data: { sessions: await listCurrentUserSessions() } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AppError("UNAUTHORIZED", "You must be signed in.", 401);
    await revokeAllSessions(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}
