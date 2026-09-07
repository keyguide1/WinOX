import { NextResponse } from "next/server";
import { apiError } from "@/lib/errors";
import { requireAdmin } from "@/lib/admin";
import { evaluateLaunchGate } from "@/lib/launch-gate";

export async function GET() {
  try {
    await requireAdmin("VIEW_DASHBOARD");
    const readiness = await evaluateLaunchGate();
    return NextResponse.json({ success: true, data: readiness });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}
