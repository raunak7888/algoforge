/*
  Warnings:

  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Algorithm` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AlgorithmForge` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AlgorithmTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Analysis` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Complexity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DisplayCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Algorithm" DROP CONSTRAINT "Algorithm_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "AlgorithmForge" DROP CONSTRAINT "AlgorithmForge_algorithmId_fkey";

-- DropForeignKey
ALTER TABLE "AlgorithmTag" DROP CONSTRAINT "AlgorithmTag_algorithmId_fkey";

-- DropForeignKey
ALTER TABLE "AlgorithmTag" DROP CONSTRAINT "AlgorithmTag_tagId_fkey";

-- DropForeignKey
ALTER TABLE "Analysis" DROP CONSTRAINT "Analysis_userId_fkey";

-- DropForeignKey
ALTER TABLE "Complexity" DROP CONSTRAINT "Complexity_algorithmId_fkey";

-- DropForeignKey
ALTER TABLE "DisplayCode" DROP CONSTRAINT "DisplayCode_algorithmId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "Algorithm";

-- DropTable
DROP TABLE "AlgorithmForge";

-- DropTable
DROP TABLE "AlgorithmTag";

-- DropTable
DROP TABLE "Analysis";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "Complexity";

-- DropTable
DROP TABLE "DisplayCode";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "name" TEXT,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "rotated_from_id" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "complexity" TEXT,
    "suggestion" TEXT,
    "result" JSONB NOT NULL,
    "share_id" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "icon_name" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "algorithms" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'beginner',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "time_best" TEXT,
    "time_average" TEXT,
    "time_worst" TEXT,
    "space_complexity" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "algorithms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "display_codes" (
    "id" TEXT NOT NULL,
    "algorithm_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "display_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forge_configs" (
    "id" TEXT NOT NULL,
    "algorithm_id" TEXT NOT NULL,
    "forge_code" JSONB NOT NULL,
    "input_schema" JSONB NOT NULL,
    "guard_ranges" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "forge_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "algorithm_tags" (
    "algorithm_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "algorithm_tags_pkey" PRIMARY KEY ("algorithm_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_token_hash_idx" ON "sessions"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "analyses_share_id_key" ON "analyses"("share_id");

-- CreateIndex
CREATE INDEX "analyses_user_id_created_at_idx" ON "analyses"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "analyses_share_id_idx" ON "analyses"("share_id");

-- CreateIndex
CREATE INDEX "categories_sort_order_idx" ON "categories"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "algorithms_slug_key" ON "algorithms"("slug");

-- CreateIndex
CREATE INDEX "algorithms_category_id_idx" ON "algorithms"("category_id");

-- CreateIndex
CREATE INDEX "algorithms_slug_idx" ON "algorithms"("slug");

-- CreateIndex
CREATE INDEX "algorithms_difficulty_idx" ON "algorithms"("difficulty");

-- CreateIndex
CREATE INDEX "algorithms_is_published_idx" ON "algorithms"("is_published");

-- CreateIndex
CREATE INDEX "display_codes_algorithm_id_idx" ON "display_codes"("algorithm_id");

-- CreateIndex
CREATE UNIQUE INDEX "display_codes_algorithm_id_language_key" ON "display_codes"("algorithm_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "forge_configs_algorithm_id_key" ON "forge_configs"("algorithm_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_label_key" ON "tags"("label");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "algorithms" ADD CONSTRAINT "algorithms_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "display_codes" ADD CONSTRAINT "display_codes_algorithm_id_fkey" FOREIGN KEY ("algorithm_id") REFERENCES "algorithms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forge_configs" ADD CONSTRAINT "forge_configs_algorithm_id_fkey" FOREIGN KEY ("algorithm_id") REFERENCES "algorithms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "algorithm_tags" ADD CONSTRAINT "algorithm_tags_algorithm_id_fkey" FOREIGN KEY ("algorithm_id") REFERENCES "algorithms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "algorithm_tags" ADD CONSTRAINT "algorithm_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
