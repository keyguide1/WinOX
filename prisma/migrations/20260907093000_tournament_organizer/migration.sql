ALTER TABLE "Tournament" ADD COLUMN "createdById" UUID;

CREATE INDEX "Tournament_createdById_startsAt_idx" ON "Tournament"("createdById", "startsAt");

ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
