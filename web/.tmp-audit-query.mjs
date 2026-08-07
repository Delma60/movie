import { db } from './lib/db/index.ts';
import { auditLogs } from './lib/db/schema.ts';
import { desc } from 'drizzle-orm';

const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(5);
console.log(rows);
