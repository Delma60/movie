import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
(async () => {
  try {
    const res = await sql.query("select table_schema, table_name from information_schema.tables where table_name = 'watch_progress'");
    console.log('RESULT', JSON.stringify(res, null, 2));
  } catch (error) {
    console.error('ERROR', error);
    process.exit(1);
  }
})();
