import assert from "node:assert/strict";
import { test } from "node:test";
import { apiError, AppError } from "@/lib/errors";
import { parseMoney } from "@/lib/money";
import { validateRuntimeConfiguration } from "@/lib/config";
import { requestIdFrom, withRequestId } from "@/lib/request-id";
import { idSchema, paginationSchema, tournamentConfigSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isSessionActive } from "@/lib/auth";

test("validation rejects malformed identifiers and unsafe pagination", () => {
  assert.equal(idSchema.safeParse("not-an-id").success, false);
  assert.equal(paginationSchema.safeParse({ page: 0, pageSize: 101 }).success, false);
  assert.equal(
    tournamentConfigSchema.safeParse({
      name: "x",
      gameId: "not-an-id",
      capacity: 1,
      startsAt: "invalid",
    }).success,
    false,
  );
  assert.equal(
    tournamentConfigSchema.safeParse({
      name: "Future Cup",
      gameId: "00000000-0000-0000-0000-000000000000",
      capacity: 8,
      startsAt: new Date(Date.now() - 1_000),
    }).success,
    false,
  );
});

test("money parser rejects non-positive and non-finite values", () => {
  assert.throws(() => parseMoney("0"));
  assert.throws(() => parseMoney("-1"));
  assert.throws(() => parseMoney("not-a-number"));
  assert.equal(parseMoney("10.129").toString(), "10.13");
});

test("API errors expose safe, consistent client responses", () => {
  assert.deepEqual(apiError(new AppError("FORBIDDEN", "Access denied.", 403)), {
    status: 403,
    body: { success: false, error: { code: "FORBIDDEN", message: "Access denied." } },
  });
  assert.deepEqual(apiError(new Error("database password")), {
    status: 500,
    body: { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong." } },
  });
});

test("request IDs preserve safe supplied values and reject oversized values", () => {
  const supplied = requestIdFrom(new Request("http://localhost", { headers: { "x-request-id": "request-123" } }));
  assert.equal(supplied, "request-123");
  const generated = requestIdFrom(new Request("http://localhost", { headers: { "x-request-id": "x".repeat(129) } }));
  assert.notEqual(generated, "x".repeat(129));

  const response = withRequestId(new Response(null, { status: 200 }), supplied);
  assert.equal(response.headers.get("x-request-id"), "request-123");
});

test("rate limit denies requests after the policy limit", async () => {
  const policy = { limit: 2, windowMs: 1_000 };
  assert.equal((await checkRateLimit("test-foundation", policy, 100)).allowed, true);
  assert.equal((await checkRateLimit("test-foundation", policy, 200)).allowed, true);
  assert.equal((await checkRateLimit("test-foundation", policy, 300)).allowed, false);
  assert.equal((await checkRateLimit("test-foundation", policy, 1_101)).allowed, true);
});

test("production configuration requires database and session secrets", () => {
  assert.throws(() => validateRuntimeConfiguration({ NODE_ENV: "production" }), /DATABASE_URL/);
  assert.throws(
    () => validateRuntimeConfiguration({ NODE_ENV: "production", DATABASE_URL: "postgresql://localhost/winox" }),
    /SESSION_SECRET/,
  );
  assert.equal(
    validateRuntimeConfiguration({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://localhost/winox",
      SESSION_SECRET: "a".repeat(32),
    }).REAL_MONEY_ENABLED,
    "false",
  );
});

test("password authentication uses a one-way Argon2id hash", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.notEqual(hash, "correct horse battery staple");
  assert.equal(await verifyPassword(hash, "correct horse battery staple"), true);
  assert.equal(await verifyPassword(hash, "wrong password"), false);
});

test("session activity rejects expired and revoked sessions", () => {
  const now = new Date("2026-09-07T00:00:00.000Z");
  assert.equal(isSessionActive({ revokedAt: null, expiresAt: new Date("2026-09-07T00:01:00.000Z") }, now), true);
  assert.equal(isSessionActive({ revokedAt: null, expiresAt: new Date("2026-09-06T23:59:00.000Z") }, now), false);
  assert.equal(isSessionActive({ revokedAt: now, expiresAt: new Date("2026-09-07T00:01:00.000Z") }, now), false);
});

test("security flags are parsed from the server environment", () => {
  const parsed = validateRuntimeConfiguration({
    NODE_ENV: "test",
    SECURITY_ENGINE_ENABLED: "false",
    ANTI_CHEAT_ENABLED: "false",
    FRAUD_ENGINE_ENABLED: "false",
    BOT_DETECTION_ENABLED: "false",
    COLLUSION_DETECTION_ENABLED: "false",
    RISK_ENGINE_ENABLED: "false",
  });
  assert.equal(parsed.SECURITY_ENGINE_ENABLED, "false");
  assert.equal(parsed.RISK_ENGINE_ENABLED, "false");
});
