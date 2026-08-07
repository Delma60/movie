import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1, prepare: false });

try {
  const rows = await sql`SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published, SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) AS archived FROM titles`;
  console.log(JSON.stringify(rows, null, 2));
} finally {
  await sql.end();
}
