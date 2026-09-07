# Disaster Recovery Runbook

The current repository has no managed backup or queue provider configured, so
RPO/RTO values are **NOT YET DEFINED** and require an infrastructure owner.

## Recovery sequence

1. Declare and classify the incident.
2. Preserve logs, audit events, database snapshots, and provider references.
3. Disable unsafe new operations through server configuration if required;
   do not delete financial records.
4. Restore PostgreSQL to an isolated environment and verify migrations.
5. Run ledger balance and orphan-reference integrity checks.
6. Restore the compatible application version and reconnect services.
7. Reconcile external provider records before resuming any financial flow.
8. Obtain an authorized review before reopening operations.

Database backups must be encrypted, access-controlled, monitored, and
periodically restored in staging. A backup that has not been restored is not
considered verified.
