# Financial Architecture

## Accounting boundary

Competition services request financial operations through server-side finance
services. They do not mutate wallet balances. The ledger is the only
authoritative source of financial state.

Each posting contains:

- a currency;
- a positive `NUMERIC(20,2)` amount;
- a debit or credit direction;
- an account category;
- an idempotency key and optional operation reference.

The posting service rejects transactions with fewer than two entries or where
the debit and credit totals differ. Repeated idempotency keys return the
original transaction.

## Account categories

Player wallet, locked, and pending accounts support the wallet read model.
Clearing, escrow, prize pool, revenue, refunds, withdrawal clearing, fees, and
adjustment categories provide the chart-of-accounts boundary for later
deposit, entry-fee, settlement, refund, and withdrawal services.

## Immutability

There is no application service for updating or deleting ledger entries.
Corrections must be implemented as linked compensating transactions in a later
phase. Database roles and migration review must additionally restrict direct
production mutation.

## Current safety boundary

`REAL_MONEY_ENABLED` remains false by default. The current wallet endpoint is a
read-only, authenticated view and exposes a `demo` marker. No payment,
withdrawal, entry-fee, or payout API has been created, so no client redirect or
client-provided amount can create financial value.
