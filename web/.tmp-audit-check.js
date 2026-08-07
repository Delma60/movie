const postgres = require('postgres');
require('dotenv').config();
(async () => {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1, prepare: false });
  try {
    const rows = await sql`select to_regclass('public.audit_logs') as exists`;
    console.log(rows);
  } finally {
    await sql.end();
  }
})();
