# Admin Control Center

The admin surface is an operations console over domain services, not a
database editor.

## Current implementation

- Server-side `requireAdmin(permission)` authorization for admin APIs.
- Operation-specific admin rate limiting.
- Real database dashboard metrics only; no fabricated players, balances,
  transactions, settlements, or alerts.
- Paginated player search with data minimization.
- Player restriction workflow with required reason and audit event.
- Admin dashboard at `/admin/dashboard`.
- Financial controls explicitly unavailable while `REAL_MONEY_ENABLED=false`.

## Permission boundary

The current Prisma role model has `ADMIN` as its administrative role. The
permission map is centralized in `src/lib/admin.ts`, so finer roles can be
introduced without trusting client-provided role or permission fields.

## Sensitive actions

Administrative mutations validate the authenticated server session, permission,
target existence, resource state, and reason. State changes are performed
inside database transactions and audited. Historical ledger entries and
financial balances are never directly editable from the admin surface.

Planned follow-up work includes granular admin roles, dispute and withdrawal
services, finance-specific models, export controls, notifications, health
checks, and dedicated admin UI pages.
