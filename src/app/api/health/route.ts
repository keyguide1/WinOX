import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { requestIdFrom, withRequestId } from "@/lib/request-id";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  let database: "ok" | "unavailable" = "ok";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = "unavailable";
  }

  const healthy = database === "ok";
  return withRequestId(NextResponse.json(
    {
      success: healthy,
      data: {
        status: healthy ? "ok" : "degraded",
        database,
        realMoneyEnabled: config.realMoneyEnabled,
        timestamp: new Date().toISOString(),
      },
    },
    { status: healthy ? 200 : 503 },
  ), requestId);
}
