# Incident Response

## Severity

- LOW: isolated non-sensitive error.
- MEDIUM: repeated service degradation or contained security signal.
- HIGH: account compromise, data-access concern, or financial-operation failure.
- CRITICAL: suspected ledger corruption, credential exposure, or broad
  unauthorized access.

## Workflow

`DETECTED -> TRIAGED -> INVESTIGATING -> CONTAINED -> RECOVERED -> RESOLVED`

Preserve evidence and correlation IDs. Restrict only the affected operation,
prefer server-side feature controls, and never erase audit or ledger history.
Security and financial decisions require an authorized reviewer. Complete a
post-incident report covering impact, timeline, root cause, recovery, and
preventive actions.
