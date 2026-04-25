ALTER TABLE "users"
ALTER COLUMN "email" DROP NOT NULL;

DROP INDEX IF EXISTS "users_googleSub_key";

ALTER TABLE "users"
DROP COLUMN IF EXISTS "googleSub";

CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key"
ON "accounts"("provider", "providerAccountId");

CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

ALTER TABLE "accounts"
ADD CONSTRAINT "accounts_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "sessions"
ADD COLUMN "rotatedFromId" TEXT;

CREATE INDEX "sessions_rotatedFromId_idx" ON "sessions"("rotatedFromId");
