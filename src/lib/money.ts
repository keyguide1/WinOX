import { Prisma } from "@prisma/client";

export const ZERO = new Prisma.Decimal(0);

export function parseMoney(value: string | number | Prisma.Decimal) {
  const amount = new Prisma.Decimal(value);
  if (amount.lte(0) || !amount.isFinite()) throw new Error("Money amounts must be finite and greater than zero.");
  return amount.toDecimalPlaces(2);
}

export function signedEntryAmount(amount: Prisma.Decimal, direction: "DEBIT" | "CREDIT") {
  return direction === "CREDIT" ? amount : amount.negated();
}
