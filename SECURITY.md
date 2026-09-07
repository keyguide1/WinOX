# Security

- Hash passwords with Argon2id (or an equivalent modern password hash).
- Use revocable server-side sessions and secure, HTTP-only cookies.
- Apply risk-specific rate limits to authentication, finance, joins, admin
  routes, and webhooks. The current in-memory limiter is development-only;
  production must use shared Redis.
- Never log passwords, tokens, payment secrets, or KYC documents.
- Validate all client input with schemas and verify authorization server-side.
- Use signed, expiring object-storage URLs for private files.
- Detect suspicious logins, support account restrictions, and add optional 2FA
  before real-money launch.
