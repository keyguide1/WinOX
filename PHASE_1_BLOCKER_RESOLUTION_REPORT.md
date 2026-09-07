# WIN OX Phase 1 Blocker Resolution Report

Date: 2026-09-07

## Blocker 1: PostgreSQL migration and integration testing

### Root cause

The local workspace has no Docker executable, Docker Compose runtime, `psql`
client, or local PostgreSQL service. GitHub Actions supplied the approved
isolated PostgreSQL 16 service.

### Action taken

- Added `tests/integration.test.ts` with real Prisma/PostgreSQL tests for:
  - user and session persistence;
  - unique email enforcement;
  - foreign-key rejection and expected user index presence;
  - session revocation persistence;
  - foreign-key-backed schema behavior through Prisma relations;
  - transaction rollback after an intentional failure.
- Added `npm run test:integration`.
- Added `npm run db:migrate:deploy`.
- Added a dedicated CI job using an ephemeral PostgreSQL 16 service.
- The CI job runs Prisma generation, validation, migration deployment, and the
  integration test suite with `RUN_DB_INTEGRATION=true`.

### Evidence and validation

- `npx prisma validate`: PASS.
- Migration diff generation: PASS.
- Local `npm run db:migrate:deploy` against the isolated localhost target:
  **P1001 — database server unreachable**.
- Local integration tests cannot execute without PostgreSQL.
- Standard local tests report the two integration tests as skipped; they are
  not counted as passing integration tests.
- GitHub Actions run `34102859829` completed successfully. The
  `postgres-integration` job applied the migration and ran the PostgreSQL
  integration suite successfully.

### Remaining risk

Local migration execution remains unavailable, but isolated CI verifies
migration application, schema creation, constraints/indexes, CRUD, session
persistence/revocation, and transaction rollback.

### Final disposition

**RESOLVED — VERIFIED IN ISOLATED CI POSTGRESQL.**

When PostgreSQL is available, execute from `win-ox`:

```text
$env:DATABASE_URL="postgresql://winox:winox@localhost:5432/winox_ci"
$env:RUN_DB_INTEGRATION="true"
npm run db:generate
npm run db:migrate:deploy
npm run test:integration
```

The repeatable CI procedure is the `postgres-integration` job in
`.github/workflows/ci.yml`.

## Blocker 2: Prisma transitive dependency advisories

### Root cause and dependency paths

`npm audit --omit=dev --json` reports four high-severity vulnerability entries:

1. `deepmerge-ts@7.1.5`, transitive path
   `prisma@6.19.0 -> @prisma/config@6.19.0 -> deepmerge-ts@7.1.5`.
2. `effect@3.18.4`, transitive path
   `prisma@6.19.0 -> @prisma/config@6.19.0 -> effect@3.18.4`.
3. The affected transitive package entry `@prisma/config@6.19.0`.
4. The direct Prisma package entry `prisma@6.19.0` that introduces the chain.

The root advisories are:

- `GHSA-ggr8-5vv4-36mx`: DeepmergeTS stack exhaustion from recursive object
  graphs, high severity, CWE-674, affected range `<8.0.0`; audit reports
  upstream fixed version `8.0.2`.
- `GHSA-38f7-945m-qr2g`: Effect `AsyncLocalStorage` context
  loss/contamination in RPC fibers, high severity, CVSS 7.4,
  CWE-362, affected range `<3.20.0`; audit reports upstream fixed version
  `3.22.1`. No CVE identifier is supplied by the advisory metadata.

### Action taken

- Kept Prisma and `@prisma/client` aligned at `6.19.0`.
- Moved the Prisma CLI to pinned development dependencies.
- Regenerated Prisma Client and revalidated the schema.
- Inspected npm's proposed fix: it selects Prisma `6.12.0`, which is a
  downgrade and would require a separate compatibility/migration verification.
- Did not apply `npm audit fix --force`.
- Added narrowly scoped npm overrides only for the two vulnerable transitive
  packages, without changing Prisma `6.19.0` or suppressing audit output.

### Exposure assessment

The vulnerable packages are used by Prisma configuration/CLI internals.
WIN OX does not expose Prisma configuration merging or Effect RPC endpoints to
untrusted users. The application uses Prisma Client for database access, so
the supply-chain finding remains relevant, but direct request-level
exploitability is limited. Existing controls include validated inputs,
server-side authorization, no production migration execution from request
handlers, and real-money mode disabled.

### Evidence and validation

- Installed versions confirmed with `npm ls`.
- Advisory ranges, GHSA identifiers, CVSS/CWE data, and npm fix proposal
  captured from `npm audit --json`.
- Prisma `6.19.0` generation: PASS.
- Prisma validation: PASS.
- Migration diff generation: PASS.
- Tests: PASS (9 foundation tests locally; PostgreSQL integration tests passed
  in CI).
- Lint: PASS.
- Typecheck: PASS.
- Production build: PASS.
- Final audit after the override: **PASS — 0 vulnerabilities**.

### Remaining risk

The override is now validated against the current Prisma toolchain. Future
Prisma upgrades should preserve the patched versions or remove the overrides
after Prisma publishes a release with an equivalent dependency chain.

### Final disposition

**RESOLVED — patched lockfile overrides are in place and verified.**

The root `package.json` pins compatible patched versions with npm overrides:
`deepmerge-ts@8.0.2` and `effect@3.22.1`. The lockfile records those exact
versions. `npm audit --omit=dev` now reports zero vulnerabilities. A clean
`npm ci` attempt was interrupted by local disk exhaustion, so installation
reproducibility still needs confirmation in CI; the existing lockfile install
was restored with `npm install --ignore-scripts` and the full application
validation passed.

## Overall disposition

Both original blockers are resolved with evidence. No Phase 2 work or
real-money activation was performed.
