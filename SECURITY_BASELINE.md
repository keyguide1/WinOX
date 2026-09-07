# Phase 4 Security Baseline

## Existing controls

- Argon2id password hashing.
- Opaque, hashed, expiring, revocable HTTP-only sessions.
- Server-side user status and role checks.
- Zod validation on authentication, tournaments, joins, and result submission.
- Operation-specific login, signup, join, financial, webhook, and admin rate
  limit policies.
- Prisma parameterized database access.
- Structured JSON logging without password or token fields.
- Demo-safe `REAL_MONEY_ENABLED=false` default.

## Implemented in this phase

- Progressive failed-login tracking and temporary account lockouts.
- Security event, risk signal, risk case, and evidence persistence.
- Active-session listing, individual revocation, and logout-all-devices.
- Security response headers.
- Configurable security feature flags.
- Modular anti-cheat provider contract.
- Participant- and match-state-checked result submission.
- Duplicate result protection and baseline result validation.

## Known follow-up work

Redis-backed distributed rate limiting, email verification and recovery,
WebSocket authorization, game-specific authoritative telemetry, collusion and
multi-account scoring, disputes/reviews, security-admin UI, object storage
evidence, background workers, and comprehensive adversarial/concurrency tests
remain planned work. No automated signal currently permanently bans or
confiscates funds.

## High-risk boundaries

Financial operations are still disabled and no client route can activate them.
Result submissions remain pending verification and never directly settle
prizes. The existing local rate limiter must be replaced with shared Redis
before multi-instance production deployment.
