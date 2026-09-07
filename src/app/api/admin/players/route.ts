import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { requireAdmin } from "@/lib/admin";

const querySchema = z.object({
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: Request) {
  try {
    await requireAdmin("VIEW_PLAYERS");
    const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const where = query.q
      ? { OR: [{ email: { contains: query.q, mode: "insensitive" as const } }, { displayName: { contains: query.q, mode: "insensitive" as const } }] }
      : {};
    const [players, total] = await Promise.all([
      db.user.findMany({
        where,
        select: { id: true, displayName: true, email: true, role: true, status: true, createdAt: true, lastLoginAt: true },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      db.user.count({ where }),
    ]);
    return NextResponse.json({ success: true, data: { players, pagination: { page: query.page, pageSize: query.pageSize, total } } });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}
