/*
  Warnings:

  - You are about to drop the column `forgeCode` on the `Algorithm` table. All the data in the column will be lost.
  - You are about to drop the column `guardRanges` on the `Algorithm` table. All the data in the column will be lost.
  - You are about to drop the column `inputSchema` on the `Algorithm` table. All the data in the column will be lost.
  - You are about to drop the column `spaceComplexity` on the `Algorithm` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Algorithm` table. All the data in the column will be lost.
  - You are about to drop the column `timeComplexity` on the `Algorithm` table. All the data in the column will be lost.
  - You are about to drop the `Snapshot` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Snapshot" DROP CONSTRAINT "Snapshot_algorithmId_fkey";

-- AlterTable
ALTER TABLE "Algorithm" DROP COLUMN "forgeCode",
DROP COLUMN "guardRanges",
DROP COLUMN "inputSchema",
DROP COLUMN "spaceComplexity",
DROP COLUMN "tags",
DROP COLUMN "timeComplexity";

-- DropTable
DROP TABLE "Snapshot";

-- CreateTable
CREATE TABLE "Complexity" (
    "id" TEXT NOT NULL,
    "algorithmId" TEXT NOT NULL,
    "timeBest" TEXT,
    "timeAverage" TEXT,
    "timeWorst" TEXT,
    "space" TEXT,

    CONSTRAINT "Complexity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisplayCode" (
    "id" TEXT NOT NULL,
    "algorithmId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "DisplayCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlgorithmForge" (
    "id" TEXT NOT NULL,
    "algorithmId" TEXT NOT NULL,
    "forgeCode" JSONB NOT NULL,
    "inputSchema" JSONB NOT NULL,
    "guardRanges" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AlgorithmForge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlgorithmTag" (
    "algorithmId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "AlgorithmTag_pkey" PRIMARY KEY ("algorithmId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Complexity_algorithmId_key" ON "Complexity"("algorithmId");

-- CreateIndex
CREATE UNIQUE INDEX "DisplayCode_algorithmId_key" ON "DisplayCode"("algorithmId");

-- CreateIndex
CREATE UNIQUE INDEX "AlgorithmForge_algorithmId_key" ON "AlgorithmForge"("algorithmId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_label_key" ON "Tag"("label");

-- CreateIndex
CREATE INDEX "Algorithm_difficulty_idx" ON "Algorithm"("difficulty");

-- AddForeignKey
ALTER TABLE "Complexity" ADD CONSTRAINT "Complexity_algorithmId_fkey" FOREIGN KEY ("algorithmId") REFERENCES "Algorithm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisplayCode" ADD CONSTRAINT "DisplayCode_algorithmId_fkey" FOREIGN KEY ("algorithmId") REFERENCES "Algorithm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlgorithmForge" ADD CONSTRAINT "AlgorithmForge_algorithmId_fkey" FOREIGN KEY ("algorithmId") REFERENCES "Algorithm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlgorithmTag" ADD CONSTRAINT "AlgorithmTag_algorithmId_fkey" FOREIGN KEY ("algorithmId") REFERENCES "Algorithm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlgorithmTag" ADD CONSTRAINT "AlgorithmTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
