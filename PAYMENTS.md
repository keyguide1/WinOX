# Payments

Real-money operations are disabled by default. A payment provider must be
wrapped behind a server-side adapter that verifies webhook signatures,
deduplicates events, and records ledger transactions only after authoritative
provider confirmation.

Deposits, withdrawals, refunds, and prize settlement require idempotency keys,
explicit audit records, concurrency-safe database transactions, and
reconciliation jobs. Never accept a client-provided balance or payment status.

## Implemented in the current phase

- Exact-currency `Decimal` ledger amounts.
- Explicit debit/credit directions and account categories.
- Balanced transaction validation.
- Idempotency-key lookup for repeated ledger posts.
- Wallet balance read model for available, locked, pending, and total amounts.
- Authenticated `GET /api/wallet`.

No deposit, withdrawal, payment-provider, or prize-settlement endpoint is
exposed yet. Those operations are intentionally unavailable while
`REAL_MONEY_ENABLED=false`.
