# Production Readiness Checklist

## Current status

- [x] Lint passes.
- [x] Production build passes.
- [x] Prisma schema validates.
- [x] Real-money mode defaults to disabled.
- [x] Server-side launch gate reports blockers and cannot be changed from the frontend.
- [x] Health endpoint does not expose secrets.
- [ ] Automated unit, integration, API, and end-to-end tests.
- [ ] Live migration against fresh and representative PostgreSQL databases.
- [ ] Redis-backed distributed rate limiting.
- [ ] Dependency audit remediation and review.
- [ ] Backup and restoration test.
- [ ] Monitoring, alerting, and error tracking.
- [ ] Failure-injection and concurrency testing.
- [ ] Provider, KYC, privacy, tax, age, jurisdiction, and regulatory review.

Any unchecked item blocks real-money activation. Legal, regulatory, privacy,
tax, and payment requirements are **REQUIRES PROFESSIONAL REVIEW**; this
repository does not claim authorization.

## Safe deployment sequence

1. Build and lint the exact artifact.
2. Validate and review migrations against staging.
3. Back up the database.
4. Deploy with `REAL_MONEY_ENABLED=false`.
5. Run `/api/health` and non-destructive smoke tests.
6. Monitor errors and security events.
7. Roll back application code only when schema compatibility is confirmed.

Never roll back financial history by editing ledger rows. Use compensating
domain transactions after an authorized investigation.
