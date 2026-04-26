ALTER TABLE "analyses"
ALTER COLUMN "result" SET NOT NULL;

CREATE INDEX "analyses_createdAt_idx" ON "analyses"("createdAt");
CREATE INDEX "analyses_userId_createdAt_id_idx" ON "analyses"("userId", "createdAt", "id");
