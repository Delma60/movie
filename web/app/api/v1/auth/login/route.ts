import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, users } from "@/lib/db";
import { issueSessionToken } from "@/lib/session";
import { apiRoute, jsonError } from "@/lib/api-auth";

export const POST = apiRoute(async (req: NextRequest) => {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("invalid_body", 400);
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) return jsonError("missing_fields", 400);

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const valid = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !valid) return jsonError("invalid_credentials", 401);

  const token = await issueSessionToken({
    sub: user.id,
    name: user.displayName,
    email: user.email,
    role: user.role,
  });

  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
  });
});
