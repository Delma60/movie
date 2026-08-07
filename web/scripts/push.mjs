// web/scripts/push.mjs
import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1, prepare: false });

try {
  console.log("Creating enums...");
  await sql`DO $$ BEGIN
    CREATE TYPE "public"."subscription_status" AS ENUM('active', 'past_due', 'canceled', 'trialing');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;
  await sql`DO $$ BEGIN
    CREATE TYPE "public"."title_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;
  await sql`DO $$ BEGIN
    CREATE TYPE "public"."title_type" AS ENUM('movie', 'series');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;
  await sql`DO $$ BEGIN
    CREATE TYPE "public"."user_role" AS ENUM('user', 'editor', 'admin');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;
  await sql`DO $$ BEGIN
    CREATE TYPE "public"."video_status" AS ENUM('processing', 'ready', 'failed');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;
  await sql`DO $$ BEGIN
    CREATE TYPE "public"."ad_placement" AS ENUM('homepage', 'title_page', 'browse');
  EXCEPTION WHEN duplicate_object THEN null; END $$`;

  console.log("Creating tables...");

  await sql`CREATE TABLE IF NOT EXISTS "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" text NOT NULL,
    "password_hash" text,
    "display_name" text NOT NULL,
    "role" "user_role" DEFAULT 'user' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email")`;

  await sql`CREATE TABLE IF NOT EXISTS "titles" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "slug" text NOT NULL,
    "title" text NOT NULL,
    "synopsis" text,
    "type" "title_type" DEFAULT 'movie' NOT NULL,
    "genre" text NOT NULL,
    "year" integer,
    "duration_minutes" integer,
    "rating" text,
    "poster_url" text,
    "backdrop_url" text,
    "trailer_url" text,
    "is_original" boolean DEFAULT false NOT NULL,
    "status" "title_status" DEFAULT 'draft' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "titles_slug_idx" ON "titles" USING btree ("slug")`;
  await sql`CREATE INDEX IF NOT EXISTS "titles_status_idx" ON "titles" USING btree ("status")`;

  await sql`CREATE TABLE IF NOT EXISTS "episodes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "title_id" uuid NOT NULL REFERENCES "titles"("id") ON DELETE CASCADE,
    "season" integer DEFAULT 1 NOT NULL,
    "episode_number" integer NOT NULL,
    "name" text NOT NULL,
    "synopsis" text,
    "duration_minutes" integer,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`;
  await sql`CREATE INDEX IF NOT EXISTS "episodes_title_idx" ON "episodes" USING btree ("title_id")`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "episodes_title_season_ep_idx" ON "episodes" USING btree ("title_id","season","episode_number")`;

  await sql`CREATE TABLE IF NOT EXISTS "video_assets" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "title_id" uuid REFERENCES "titles"("id") ON DELETE CASCADE,
    "episode_id" uuid REFERENCES "episodes"("id") ON DELETE CASCADE,
    "source_url" text NOT NULL,
    "status" "video_status" DEFAULT 'processing' NOT NULL,
    "duration_seconds" integer,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`;
  await sql`CREATE INDEX IF NOT EXISTS "video_assets_title_idx" ON "video_assets" USING btree ("title_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "video_assets_episode_idx" ON "video_assets" USING btree ("episode_id")`;

  await sql`CREATE TABLE IF NOT EXISTS "watch_progress" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title_id" uuid REFERENCES "titles"("id") ON DELETE CASCADE,
    "episode_id" uuid REFERENCES "episodes"("id") ON DELETE CASCADE,
    "seconds_watched" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`;
  await sql`CREATE INDEX IF NOT EXISTS "watch_progress_user_idx" ON "watch_progress" USING btree ("user_id")`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "watch_progress_user_title_idx" ON "watch_progress" USING btree ("user_id","title_id")`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "watch_progress_user_episode_idx" ON "watch_progress" USING btree ("user_id","episode_id")`;

  await sql`CREATE TABLE IF NOT EXISTS "my_list" (
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title_id" uuid NOT NULL REFERENCES "titles"("id") ON DELETE CASCADE,
    "added_at" timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY ("user_id","title_id")
  )`;

  await sql`CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "plan" text NOT NULL,
    "status" "subscription_status" DEFAULT 'trialing' NOT NULL,
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`;
  await sql`CREATE INDEX IF NOT EXISTS "subscriptions_user_idx" ON "subscriptions" USING btree ("user_id")`;

  await sql`CREATE TABLE IF NOT EXISTS "ads" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "headline" text NOT NULL,
    "description" text,
    "placement" "ad_placement" DEFAULT 'homepage' NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "title_id" uuid REFERENCES "titles"("id") ON DELETE SET NULL,
    "cta_text" text NOT NULL,
    "cta_url" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`;
  await sql`CREATE INDEX IF NOT EXISTS "ads_placement_idx" ON "ads" USING btree ("placement")`;
  await sql`CREATE INDEX IF NOT EXISTS "ads_active_idx" ON "ads" USING btree ("active")`;
  await sql`CREATE INDEX IF NOT EXISTS "ads_title_idx" ON "ads" USING btree ("title_id")`;

  await sql`CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "actor_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
    "actor_name" text NOT NULL,
    "actor_email" text NOT NULL,
    "action" text NOT NULL,
    "target_type" text NOT NULL,
    "target_id" uuid,
    "target_label" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`;
  // Ensure columns exist if the table was created in a prior run without them.
  await sql`ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "target_type" text NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE "audit_logs" ALTER COLUMN "target_type" DROP DEFAULT`;
  await sql`ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "target_id" uuid`;
  await sql`ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "target_label" text`;
  await sql`ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "metadata" jsonb`;

  await sql`CREATE INDEX IF NOT EXISTS "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at")`;
  await sql`CREATE INDEX IF NOT EXISTS "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "audit_logs_target_idx" ON "audit_logs" USING btree ("target_type","target_id")`;

  await sql`CREATE TABLE IF NOT EXISTS "vert_storage_buckets" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "project_id" uuid NOT NULL,
    "name" text NOT NULL,
    "public" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS "storage_buckets_project_name_idx" ON "vert_storage_buckets" USING btree ("project_id","name")`;
  await sql`CREATE INDEX IF NOT EXISTS "storage_buckets_project_idx" ON "vert_storage_buckets" USING btree ("project_id")`;

  console.log("Schema is up to date.");
} finally {
  await sql.end();
}