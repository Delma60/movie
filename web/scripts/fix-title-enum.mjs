import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1, prepare: false });

try {
  await sql.unsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'title_status'
          AND e.enumlabel = 'archived'
      ) THEN
        ALTER TYPE "public"."title_status" ADD VALUE 'archived';
      END IF;
    END $$;
  `);
  console.log('title_status enum updated');
} finally {
  await sql.end();
}
