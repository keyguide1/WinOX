import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const integrationEnabled = process.env.RUN_DB_INTEGRATION === "true";

test("PostgreSQL persists users and revocable sessions", { skip: !integrationEnabled }, async () => {
  const email = `${randomUUID()}@integration.test`;
  const displayName = `integration_${randomUUID().replaceAll("-", "").slice(0, 20)}`;
  const user = await db.user.create({
    data: {
      email,
      displayName,
      passwordHash: "argon2id-test-hash",
      sessions: {
        create: {
          tokenHash: randomUUID(),
          expiresAt: new Date(Date.now() + 60_000),
        },
      },
    },
    include: { sessions: true },
  });

  assert.equal(user.sessions.length, 1);
  assert.equal(user.status, "ACTIVE");

  const session = user.sessions[0];
  const revoked = await db.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date(), revokedReason: "INTEGRATION_TEST" },
  });
  assert.equal(revoked.revokedReason, "INTEGRATION_TEST");

  await assert.rejects(
    db.user.create({
      data: {
        email,
        displayName: `duplicate_${randomUUID().replaceAll("-", "").slice(0, 20)}`,
        passwordHash: "argon2id-test-hash",
      },
    }),
    (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002",
  );

  await assert.rejects(
    db.session.create({
      data: {
        userId: randomUUID(),
        tokenHash: randomUUID(),
        expiresAt: new Date(Date.now() + 60_000),
      },
    }),
    (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003",
  );

  const userIndexes = await db.$queryRaw<Array<{ indexname: string }>>(
    Prisma.sql`SELECT indexname FROM pg_indexes WHERE tablename = 'User'`,
  );
  assert.ok(userIndexes.some(({ indexname }) => indexname.includes("email")));

  await db.user.delete({ where: { id: user.id } });
  assert.equal(await db.user.findUnique({ where: { id: user.id } }), null);
});

test("PostgreSQL transactions roll back failed writes", { skip: !integrationEnabled }, async () => {
  const email = `${randomUUID()}@rollback.test`;
  const displayName = `rollback_${randomUUID().replaceAll("-", "").slice(0, 20)}`;

  await assert.rejects(
    db.$transaction(async (transaction) => {
      await transaction.user.create({
        data: { email, displayName, passwordHash: "argon2id-test-hash" },
      });
      throw new Error("intentional integration rollback");
    }),
    /intentional integration rollback/,
  );

  assert.equal(await db.user.findUnique({ where: { email } }), null);
});

test("PostgreSQL preserves tournament ownership and duplicate-entry constraints", { skip: !integrationEnabled }, async () => {
  const organizer = await db.user.create({
    data: {
      email: `${randomUUID()}@organizer.test`,
      displayName: `organizer_${randomUUID().replaceAll("-", "").slice(0, 20)}`,
      passwordHash: "argon2id-test-hash",
      role: "ADMIN",
    },
  });
  const game = await db.game.create({
    data: {
      slug: `integration-${randomUUID()}`,
      name: "Integration Arena",
      description: "Database integration game.",
    },
  });
  const tournament = await db.tournament.create({
    data: {
      createdById: organizer.id,
      gameId: game.id,
      name: "Integration Cup",
      rules: {},
      capacity: 2,
      startsAt: new Date(Date.now() + 60_000),
      status: "OPEN",
    },
  });
  assert.equal(
    (await db.tournament.findUnique({ where: { id: tournament.id }, select: { createdById: true } }))?.createdById,
    organizer.id,
  );

  await db.tournamentEntry.create({ data: { tournamentId: tournament.id, userId: organizer.id } });
  await assert.rejects(
    db.tournamentEntry.create({ data: { tournamentId: tournament.id, userId: organizer.id } }),
    (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002",
  );

  await db.tournament.delete({ where: { id: tournament.id } });
  await db.game.delete({ where: { id: game.id } });
  await db.user.delete({ where: { id: organizer.id } });
});

test.after(async () => {
  if (integrationEnabled) await db.$disconnect();
});
