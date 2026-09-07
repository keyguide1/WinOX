import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new AppError("UNAUTHORIZED", "You must be signed in.", 401);
    const wallet = await db.wallet.findUnique({
      where: { userId: user.id },
      include: { accounts: { include: { entries: true } } },
    });
    if (!wallet) throw new AppError("NOT_FOUND", "Wallet not found.", 404);

    const balances = wallet.accounts.reduce(
      (result, account) => {
        const signed = account.entries.reduce(
          (sum, entry) => sum.plus(entry.direction === "CREDIT" ? entry.amount : entry.amount.negated()),
          new Prisma.Decimal(0),
        );
        if (account.type === "PLAYER_WALLET") result.available = result.available.plus(signed);
        if (account.type === "PLAYER_LOCKED") result.locked = result.locked.plus(signed);
        if (account.type === "PLAYER_PENDING") result.pending = result.pending.plus(signed);
        return result;
      },
      { available: new Prisma.Decimal(0), locked: new Prisma.Decimal(0), pending: new Prisma.Decimal(0) },
    );

    return NextResponse.json({
      success: true,
      data: {
        currency: wallet.currency,
        available: balances.available.toFixed(2),
        locked: balances.locked.toFixed(2),
        pending: balances.pending.toFixed(2),
        total: balances.available.plus(balances.locked).plus(balances.pending).toFixed(2),
        demo: process.env.REAL_MONEY_ENABLED !== "true",
      },
    });
  } catch (error) {
    const result = apiError(error);
    return NextResponse.json(result.body, { status: result.status });
  }
}
