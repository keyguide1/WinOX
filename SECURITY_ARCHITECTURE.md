# Security Architecture

## Trust boundaries

The browser only submits requests. Authentication, authorization, tournament
state, match results, risk decisions, and financial state are server- and
database-authoritative.

Protected routes must establish a server session, validate input, verify
ownership and resource state, apply the operation-specific rate limit, and
record sensitive security events. Client fields such as `isAdmin`, `verified`,
`winner`, `balance`, `riskLevel`, and `status` are never accepted as authority.

## Account and session security

Passwords use Argon2id. Sessions are opaque, hashed before persistence,
HTTP-only, SameSite cookies with expiry and revocation. Failed logins are
tracked per account with progressive temporary locks. Active sessions can be
listed, revoked individually, or revoked across all devices through:

- `GET /api/security/sessions`
- `DELETE /api/security/sessions/:id`
- `DELETE /api/security/sessions`

The API intentionally returns no token hashes or password material.

## Risk and integrity model

Security events, risk signals, risk cases, and evidence have separate
authoritative records. A signal is not guilt: signals carry severity and
confidence and should be combined by the risk engine before a review or
restriction. High-impact account or financial actions require an authorized
review workflow in later phases.

The game-plugin boundary in `src/lib/games.ts` is the extension point for
authoritative result validation and game-specific anti-cheat providers. A
client result claim is never sufficient for settlement.

`POST /api/matches/:id/result` verifies the authenticated participant, match
state, tournament membership, payload schema, duplicate submission, and
game-plugin validation. It records suspicious signals for review and returns a
pending-verification result; it does not declare a winner.

## Privacy and evidence

Only security-relevant metadata should be recorded. Evidence references and
content hashes are stored rather than private files; private evidence must use
authorized, expiring object-storage URLs when file storage is added.

## Current limitations

The current phase provides the schema and server primitives. Redis-backed
distributed rate limiting, full anti-cheat providers, WebSocket authorization,
review UI, disputes, and automated workers remain subsequent implementation
work. Real-money operations remain disabled by server configuration.
