// web/scripts/reset.mjs
import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1, prepare: false });

try {
  console.log("Dropping existing tables...");
  await sql`DROP TABLE IF EXISTS "watch_progress" CASCADE`;
  await sql`DROP TABLE IF EXISTS "my_list" CASCADE`;
  await sql`DROP TABLE IF EXISTS "subscriptions" CASCADE`;
  await sql`DROP TABLE IF EXISTS "video_assets" CASCADE`;
  await sql`DROP TABLE IF EXISTS "episodes" CASCADE`;
  await sql`DROP TABLE IF EXISTS "titles" CASCADE`;
  await sql`DROP TABLE IF EXISTS "users" CASCADE`;
  await sql`DROP TABLE IF EXISTS "vert_storage_buckets" CASCADE`;
  await sql`DROP TYPE IF EXISTS "subscription_status" CASCADE`;
  await sql`DROP TYPE IF EXISTS "title_status" CASCADE`;
  await sql`DROP TYPE IF EXISTS "title_type" CASCADE`;
  await sql`DROP TYPE IF EXISTS "user_role" CASCADE`;
  await sql`DROP TYPE IF EXISTS "video_status" CASCADE`;
  console.log("Done — database is clean.");
} finally {
  await sql.end();
}