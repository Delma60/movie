"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";

export async function updateProfile(formData: FormData): Promise<void> {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login?returnTo=/account");

  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!displayName || !email) {
    redirect("/account?error=invalid_profile");
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing && existing.id !== user.id) {
    redirect("/account?error=email_taken");
  }

  await db.update(users).set({ displayName, email }).where(eq(users.id, user.id));
  redirect("/account?success=profile_updated");
}

export async function changePassword(formData: FormData): Promise<void> {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login?returnTo=/account");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!newPassword || newPassword.length < 8 || newPassword !== confirmPassword) {
    redirect("/account?error=invalid_password");
  }

  const [existing] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);

  if (existing?.passwordHash && currentPassword) {
    const valid = await bcrypt.compare(currentPassword, existing.passwordHash);
    if (!valid) {
      redirect("/account?error=wrong_password");
    }
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
  redirect("/account?success=password_updated");
}

export async function signOutEverywhere(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/account?success=signed_out_everywhere");
}
