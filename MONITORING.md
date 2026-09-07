# Monitoring and Alerting

The current application emits structured server logs and persists security and
audit events. The `/api/health` endpoint reports application/database
availability without returning credentials.

Production monitoring still needs an infrastructure-backed implementation for:

- API error rate and latency.
- Authentication failures and rate-limit events.
- Database availability, latency, and connection saturation.
- Ledger errors and integrity-check failures.
- Match/result and tournament failures.
- Risk, anti-cheat, and account-takeover signals.
- Worker, queue, webhook, payment, and notification failures.

Critical alerts should page the responsible operator without including
passwords, tokens, provider secrets, KYC content, or database URLs.
