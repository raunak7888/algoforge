-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('beginner', 'intermediate', 'advanced');

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
CREATE TABLE "explanation_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "share_id" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "explanation_sessions_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "explanation_sessions_share_id_key" ON "explanation_sessions"("share_id");

-- CreateIndex
CREATE INDEX "explanation_sessions_user_id_created_at_idx" ON "explanation_sessions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "explanation_sessions_share_id_idx" ON "explanation_sessions"("share_id");

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
ALTER TABLE "explanation_sessions" ADD CONSTRAINT "explanation_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
