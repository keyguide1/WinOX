# Real-Money Activation Gate

WIN OX remains in sandbox mode by default. `REAL_MONEY_ENABLED=false` is the
required development and staging state, and there is no frontend or ordinary
admin toggle that can activate it.

The server-side gate requires both:

1. trusted environment configuration explicitly allowing real money; and
2. every launch-readiness check to be `READY`.

The checks cover compliance, payment provider readiness, KYC, age and
jurisdiction eligibility, responsible play, security, anti-cheat, fraud,
ledger integrity, reconciliation, withdrawals, monitoring, backups, disaster
recovery, incident response, support, terms, and privacy.

`GET /api/admin/launch-readiness` exposes the current status to an authorized
administrator without exposing secrets or allowing mutation. Readiness records
must be changed only through a future audited operational workflow; this phase
does not add a bypass.

## Current decision

**NO-GO / SANDBOX**. No provider integration, KYC approval, regulatory
approval, withdrawal flow, settlement flow, or production operations approval
exists in this repository. Unknown legal and regulatory requirements remain
**REQUIRES PROFESSIONAL REVIEW**.

Any future activation must record environment, actor, request ID,
configuration, readiness evidence, and timestamp in an immutable activation
record. Financial history must never be edited during activation or shutdown.
