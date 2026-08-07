const postgres = require('postgres');
require('dotenv').config();

(async () => {
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1, prepare: false });

  try {
    await sql`ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_name text`;
    await sql`ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_email text`;
    await sql`ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS metadata jsonb`;
    await sql`ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_label text`;
    await sql`ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_id uuid`;
    await sql`ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_type text`;
    await sql`ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action text`;
    await sql`ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS created_at timestamp with time zone`;

    await sql`UPDATE public.audit_logs SET actor_name = COALESCE(actor_name, COALESCE(actor_role, 'unknown')) WHERE actor_name IS NULL`;
    await sql`UPDATE public.audit_logs SET actor_email = COALESCE(actor_email, '') WHERE actor_email IS NULL`;
    await sql`UPDATE public.audit_logs SET action = COALESCE(action, resource) WHERE action IS NULL OR action = ''`;

    await sql`ALTER TABLE public.audit_logs DROP COLUMN IF EXISTS actor_role`;
    await sql`ALTER TABLE public.audit_logs DROP COLUMN IF EXISTS resource`;
    await sql`ALTER TABLE public.audit_logs DROP COLUMN IF EXISTS meta`;

    console.log('audit_logs schema aligned');
  } finally {
    await sql.end();
  }
})();
