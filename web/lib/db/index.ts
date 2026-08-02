import path from "path";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

config({ path: path.resolve(process.cwd(), ".env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// neon-http = stateless, one request per query, works in Next.js
// server components/route handlers and edge runtimes without
// holding a persistent connection.
const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });

export * from "./schema";