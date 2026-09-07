# WinOX

WinOX is a skill-based competitive gaming platform. The current release is a
demo-safe web foundation: real-money operations are disabled unless explicitly
enabled by server configuration.

## Architecture

- Next.js App Router and TypeScript for the web and future mobile-consumable API.
- PostgreSQL is the authoritative store planned for users, tournaments, matches,
  and the immutable double-entry ledger.
- Redis/BullMQ will provide shared rate limits and idempotent background jobs.
- S3-compatible object storage will hold private KYC, evidence, and avatar files.
- `src/lib/config.ts` centralizes operational and financial policy.

Read [ARCHITECTURE.md](./ARCHITECTURE.md), [DATABASE.md](./DATABASE.md),
[SECURITY.md](./SECURITY.md), [PAYMENTS.md](./PAYMENTS.md),
[TOURNAMENTS.md](./TOURNAMENTS.md), [ADMIN.md](./ADMIN.md),
[PHASE6_BASELINE_REPORT.md](./PHASE6_BASELINE_REPORT.md), and
[PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md).

## Setup

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

`REAL_MONEY_ENABLED` defaults to `false`. Do not enable real-money flows
without production payment, KYC, compliance, ledger, and reconciliation
implementations.

## Commands

```powershell
npm run lint
npm run build
```

## Security notes

The browser is never authoritative for identity, roles, balances, scores,
payments, or settlements. Financial features must write immutable ledger
transactions and enforce idempotency and double-entry balancing on the server.
