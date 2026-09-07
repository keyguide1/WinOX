# Architecture

The platform is built in phases so the public experience can ship without
pretending that financial functionality exists.

1. Foundation: Next.js UI, centralized config, validation, errors, logging,
   rate-limit policies, and demo-mode separation.
2. Competition: games, tournaments, matchmaking, authoritative result
   verification, leaderboards, achievements, and notifications.
3. Financial: wallets, immutable double-entry ledger, payment adapters,
   withdrawals, refunds, and idempotent settlement.
4. Security and operations: RBAC, device/session controls, fraud, disputes,
   audit logs, queues, monitoring, backups, and reconciliation.

Business logic belongs in server-side services and must remain usable by
future Android/iOS clients. The client presents state; it does not create
money, declare winners, or approve withdrawals.
