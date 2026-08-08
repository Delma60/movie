import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { apiRoute, jsonError } from "@/lib/api-auth";

export const GET = apiRoute(async (_req, { session }) => {
  if (!session) return jsonError("unauthorized", 401);

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);

  if (!user) return jsonError("not_found", 404);
  return NextResponse.json({ user });
}, { requireAuth: true });
