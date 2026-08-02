"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, users } from "@/lib/db";
import { issueSessionToken, SESSION_COOKIE } from "@/lib/session";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function safeReturnTo(value: FormDataEntryValue | null): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : "/";
}

async function startSession(user: { id: string; displayName: string; email: string }) {
  const token = await issueSessionToken({
    sub: user.id,
    name: user.displayName,
    email: user.email,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function loginWithPassword(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const returnTo = safeReturnTo(formData.get("returnTo"));

  if (!email || !password) {
    redirect(`/login?error=missing_fields&returnTo=${encodeURIComponent(returnTo)}`);
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  const valid = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !valid) {
    redirect(`/login?error=invalid_credentials&returnTo=${encodeURIComponent(returnTo)}`);
  }

  await startSession(user);
  redirect(returnTo);
}

export async function registerWithPassword(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const returnTo = safeReturnTo(formData.get("returnTo"));

  if (!name || !email || password.length < 8) {
    redirect(`/signup?error=invalid_input&returnTo=${encodeURIComponent(returnTo)}`);
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    redirect(`/signup?error=email_taken&returnTo=${encodeURIComponent(returnTo)}`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({ email, displayName: name, passwordHash, role: "user" })
    .returning();

  await startSession(user);
  redirect(returnTo);
}
