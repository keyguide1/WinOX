# Database

PostgreSQL is the system of record. Financial truth must never be cached as an
authoritative value.

The current schema includes users, sessions, games, game versions, tournaments,
entries, matches, verified results, wallets, ledger accounts, ledger
transactions, ledger entries, and audit events. Payment, withdrawal, refund,
settlement, and reconciliation aggregates remain subsequent implementation
phases and must not be simulated in the UI.

Financial amounts use PostgreSQL `NUMERIC(20,2)` through Prisma `Decimal`.
Ledger accounts carry an explicit account category and currency. Wallet
balances are read by summing authoritative ledger entries, not by trusting a
mutable balance field.

Every ledger transaction must balance total debits and credits. Corrections are
new reversal/refund transactions; original transactions are never edited.
Production migrations and backups must be run through the deployment pipeline.
The initial schema migration is
`prisma/migrations/20260907013000_financial_foundation/migration.sql`.
