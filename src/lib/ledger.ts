import { Prisma, type LedgerAccountType, type LedgerEntryDirection } from "@prisma/client";
import { db } from "@/lib/db";
import { parseMoney, signedEntryAmount } from "@/lib/money";

export type LedgerPosting = {
  accountId: string;
  amount: string | number | Prisma.Decimal;
  direction: LedgerEntryDirection;
};

function assertBalanced(postings: LedgerPosting[]) {
  if (postings.length < 2) throw new Error("A ledger transaction requires at least two entries.");
  const debits = postings.filter((entry) => entry.direction === "DEBIT").reduce((sum, entry) => sum.plus(parseMoney(entry.amount)), new Prisma.Decimal(0));
  const credits = postings.filter((entry) => entry.direction === "CREDIT").reduce((sum, entry) => sum.plus(parseMoney(entry.amount)), new Prisma.Decimal(0));
  if (!debits.eq(credits)) throw new Error("Ledger transaction is not balanced.");
}

export async function getOrCreateWalletAccount(userId: string, type: LedgerAccountType, currency = "GHS") {
  const wallet = await db.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, currency },
  });
  return db.ledgerAccount.upsert({
    where: { walletId_type_currency: { walletId: wallet.id, type, currency } },
    update: {},
    create: { walletId: wallet.id, type, currency },
  });
}

export async function postLedgerTransaction(input: {
  idempotencyKey: string;
  reason: string;
  reference?: string;
  currency: string;
  postings: LedgerPosting[];
}) {
  assertBalanced(input.postings);
  for (const posting of input.postings) {
    const amount = parseMoney(posting.amount);
    if (amount.decimalPlaces() > 2) throw new Error("Currency amounts support at most two decimal places.");
  }

  return db.$transaction(async (tx) => {
    const existing = await tx.ledgerTransaction.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { entries: true },
    });
    if (existing) return existing;

    const transaction = await tx.ledgerTransaction.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        reason: input.reason,
        reference: input.reference,
        currency: input.currency,
        entries: {
          create: input.postings.map((posting) => ({
            accountId: posting.accountId,
            amount: parseMoney(posting.amount),
            direction: posting.direction,
          })),
        },
      },
      include: { entries: true },
    });

    const total = transaction.entries.reduce(
      (sum, entry) => sum.plus(signedEntryAmount(entry.amount, entry.direction)),
      new Prisma.Decimal(0),
    );
    if (!total.eq(0)) throw new Error("Ledger integrity check failed.");
    return transaction;
  });
}
