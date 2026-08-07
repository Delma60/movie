const postgres = require('postgres');
require('dotenv').config();
(async () => {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1, prepare: false });
  try {
    const rows = await sql`select column_name, data_type from information_schema.columns where table_schema='public' and table_name='audit_logs' order by ordinal_position`;
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await sql.end();
  }
})();
