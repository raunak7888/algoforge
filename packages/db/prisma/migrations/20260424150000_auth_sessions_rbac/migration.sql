CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

ALTER TABLE "users"
ADD COLUMN "googleSub" TEXT,
ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER';

ALTER TABLE "analyses"
ADD COLUMN "suggestion" TEXT,
ADD COLUMN "timeEstimate" TEXT;

CREATE UNIQUE INDEX "users_googleSub_key" ON "users"("googleSub");

CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");
CREATE INDEX "sessions_revokedAt_idx" ON "sessions"("revokedAt");

ALTER TABLE "sessions"
ADD CONSTRAINT "sessions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
