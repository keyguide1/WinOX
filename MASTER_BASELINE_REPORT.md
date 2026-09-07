# WIN OX Master Engineering Baseline

Date: 2026-09-07

## Audit scope

The repository was inspected before changes. It is a Next.js App Router
TypeScript application with Prisma/PostgreSQL models, server route handlers,
opaque cookie sessions, Argon2id passwords, Zod validation, a basic admin
surface, an accounting foundation, and security/risk records.

## Architecture inventory

### Present

- **Frontend:** public player landing page, responsive styling, PWA manifest,
  metadata, sitemap, robots, and server-rendered admin dashboard.
- **Backend:** Next.js route handlers for auth, tournaments, joins, wallet
  reads, match result submission, security sessions, admin metrics/player
  operations, launch readiness, and health.
- **Database:** Prisma PostgreSQL schema with users, sessions, games,
  tournaments, matches/results, wallets, decimal ledger accounts/entries,
  security events, risk signals/cases/evidence, readiness checks, and
  activation audit records.
- **Security:** Argon2id, expiring/revocable sessions, progressive login
  lockout, Zod validation, server-side role/permission checks, rate-limit
  policies, security headers, anti-cheat provider boundary, and audit events.
- **Configuration:** `.env.example`, centralized config, demo-safe
  `REAL_MONEY_ENABLED=false`, security flags, and launch-readiness gate.
- **Documentation:** architecture, database, security, payments, tournaments,
  admin, recovery, incident, monitoring, compliance, and readiness documents.

### Absent or partial

- A minimal automated foundation test runner and CI workflow now exist;
  a disposable PostgreSQL integration job is configured but not yet executed.
- No live PostgreSQL/Redis/queue/object-storage deployment in this workspace.
- No migrations have been applied to a live database; migration SQL exists.
- No matchmaking, check-in, bracket, leaderboard, notification, WebSocket, or
  background-worker implementation.
- No provider-backed deposits, withdrawals, refunds, settlements, escrow,
  reconciliation, KYC, age, jurisdiction, or responsible-play services.
- No granular admin roles, MFA, password reset, email verification, dispute UI,
  exports, or system-health integrations.
- Redis-backed distributed rate limiting now exists when `REDIS_URL` is
  configured; development retains an in-memory fallback and production fails
  closed when Redis is unavailable.

## Baseline validation

| Check | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run build` / TypeScript | PASS |
| Prisma client generation | PASS |
| Prisma schema validation with `DATABASE_URL` | PASS |
| Automated foundation tests | PASS: 9 foundation tests; 2 PostgreSQL integration tests skipped locally |
| CI foundation | IMPLEMENTED: lint, typecheck, Prisma generation/validation, tests, build |
| Live migration test | BLOCKED locally: Prisma P1001; disposable CI job configured |
| Production dependency audit | PASS: 0 vulnerabilities after patched lockfile overrides |

## Phase status

| Phase | Status | Evidence |
| --- | --- | --- |
| Phase 1 Foundation | PARTIAL | Core scaffold, auth, config, validation, request IDs, foundation tests, CI, distributed limiter, patched dependency chain, and disposable PostgreSQL job exist; live DB execution remains |
| Phase 2 Competition | PARTIAL | Games, tournaments, entries, matches, and pending result boundary exist; matchmaking and authoritative completion are absent |
| Phase 3 Wallet/Payments | PARTIAL | Decimal ledger foundation and wallet read API exist; payment and withdrawal lifecycles are absent |
| Phase 4 Security | PARTIAL | Sessions, login lockout, risk records, headers, and anti-cheat boundary exist; distributed controls and review workflows are absent |
| Phase 5 Admin | PARTIAL | Dashboard, player search, restriction workflow, and permission checks exist; full operations center is absent |
| Phase 6 Readiness | PARTIAL | Reports, checklists, health endpoint, and runbooks exist; tests, backups, monitoring, and recovery evidence are absent |
| Phase 7 Activation | BLOCKED | Server gate exists, but every readiness check is not ready and real money remains disabled |

## Risk register

### Critical

- Real-money operations are not implemented end-to-end; activation must remain
  disabled.
- Live database migration verification and database-backed integration tests are
  configured for CI but have not executed in this environment.
- No backup, restoration, queue recovery, or production monitoring evidence.

### High

- Redis must be provisioned and configured for multi-instance rate limiting;
  production fails closed if it is absent or unavailable.
- Prisma dependency audit is clean after patched transitive overrides; CI clean-install confirmation remains.
- Financial ledger application immutability is not equivalent to database-role
  immutability in production.
- Match/result verification is incomplete and cannot support prize settlement.

### Medium

- Admin role model is currently coarse (`ADMIN`), despite permission constants.
- No MFA, email verification, recovery, or WebSocket authorization.
- No load, stress, failure-injection, or concurrency test harness.

## Required next action

The requested workflow requires Phase 1 to be verified before Phase 2 is
considered complete. Phase 1 remains **PARTIAL**, not complete. The Prisma
dependency blocker is remediated; database-backed tests and live migration
execution remain blocked by unavailable isolated PostgreSQL infrastructure.
See `PHASE_1_VERIFICATION_REPORT.md` and
`PHASE_1_BLOCKER_RESOLUTION_REPORT.md`.
