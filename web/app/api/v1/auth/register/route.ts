import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, users } from "@/lib/db";
import { issueSessionToken } from "@/lib/session";
import { resolveInitialRole } from "@/lib/roles";
import { apiRoute, jsonError } from "@/lib/api-auth";

export const POST = apiRoute(async (req: NextRequest) => {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("invalid_body", 400);
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  if (!name || !email || password.length < 8) return jsonError("invalid_input", 400);

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return jsonError("email_taken", 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({ email, displayName: name, passwordHash, role: resolveInitialRole(email) })
    .returning();

  const token = await issueSessionToken({
    sub: user.id,
    name: user.displayName,
    email: user.email,
    role: user.role,
  });

  return NextResponse.json(
    { token, user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role } },
    { status: 201 },
  );
});
