"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { extname } from "path";
import { db, titles, users } from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import { slugify } from "@/lib/slug";
import { uploadObject } from "@/lib/s3";
import type { TitleStatus, TitleType } from "@/lib/db/schema";

const VALID_TYPES: TitleType[] = ["movie", "series"];
const VALID_STATUSES: TitleStatus[] = ["draft", "published"];

/** Same live-role-check pattern as lib/actions/admin-users.ts — these mutate
 * catalog content, so they re-check the actor's role from the DB rather than
 * trusting a possibly-stale session JWT. */
async function requireEditorActor() {
  const session = await getSession();
  if (!session?.email) throw new Error("Not signed in.");

  const [actor] = await db
    .select({ id: users.id, role: users.role, displayName: users.displayName, email: users.email })
    .from(users)
    .where(eq(users.email, session.email))
    .limit(1);

  if (!actor || !hasRole(actor.role, "editor")) {
    throw new Error("Editor role required.");
  }

  return actor;
}

export async function toggleTitleStatus(titleId: string, nextStatus: TitleStatus): Promise<void> {
  const actor = await requireEditorActor();

  const [before] = await db
    .select({ title: titles.title, status: titles.status })
    .from(titles)
    .where(eq(titles.id, titleId))
    .limit(1);

  await db
    .update(titles)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(eq(titles.id, titleId));

  await logAdminAction({
    actor: { id: actor.id, name: actor.displayName, email: actor.email },
    action: "title.status_changed",
    targetType: "title",
    targetId: titleId,
    targetLabel: before?.title ?? null,
    metadata: { from: before?.status ?? null, to: nextStatus },
  });

  revalidatePath("/admin/titles");
  revalidatePath("/browse");
}

export async function createTitle(formData: FormData): Promise<void> {
  const actor = await requireEditorActor();

  const title = String(formData.get("title") ?? "").trim();
  const genre = String(formData.get("genre") ?? "").trim();
  const type = String(formData.get("type") ?? "movie") as TitleType;
  const status = String(formData.get("status") ?? "draft") as TitleStatus;
  const synopsis = String(formData.get("synopsis") ?? "").trim() || null;
  const rating = String(formData.get("rating") ?? "").trim() || null;
  let posterUrl = String(formData.get("posterUrl") ?? "").trim() || null;
  let backdropUrl = String(formData.get("backdropUrl") ?? "").trim() || null;
  const trailerUrl = String(formData.get("trailerUrl") ?? "").trim() || null;
  const isOriginal = formData.get("isOriginal") === "on";
  const posterFile = formData.get("posterFile");
  const backdropFile = formData.get("backdropFile");
  const slugInput = String(formData.get("slug") ?? "").trim();
  const yearRaw = String(formData.get("year") ?? "").trim();
  const durationRaw = String(formData.get("durationMinutes") ?? "").trim();

  if (!title || !genre) {
    redirect("/admin/titles/new?error=missing_fields");
  }
  if (!VALID_TYPES.includes(type)) {
    redirect("/admin/titles/new?error=invalid_type");
  }
  if (!VALID_STATUSES.includes(status)) {
    redirect("/admin/titles/new?error=invalid_status");
  }

  const slug = slugify(slugInput || title);
  if (!slug) {
    redirect("/admin/titles/new?error=invalid_slug");
  }

  const [existingSlug] = await db
    .select({ id: titles.id })
    .from(titles)
    .where(eq(titles.slug, slug))
    .limit(1);
  if (existingSlug) {
    redirect("/admin/titles/new?error=slug_taken");
  }

  let year: number | null = null;
  if (yearRaw) {
    year = Number(yearRaw);
    if (!Number.isFinite(year) || year < 1888 || year > 2100) {
      redirect("/admin/titles/new?error=invalid_year");
    }
  }

  let durationMinutes: number | null = null;
  if (type === "movie" && durationRaw) {
    durationMinutes = Number(durationRaw);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      redirect("/admin/titles/new?error=invalid_duration");
    }
  }

  const storageProjectId = process.env.STORAGE_PROJECT_ID ?? "movie";
  const storageBucket = process.env.STORAGE_LOGICAL_BUCKET ?? "titles";

  function isUpload(value: unknown): value is File {
    return (
      typeof value === "object" &&
      value !== null &&
      "arrayBuffer" in value &&
      typeof (value as any).arrayBuffer === "function" &&
      typeof (value as any).name === "string"
    );
  }

  async function maybeUploadFile(value: unknown, suffix: string): Promise<string | null> {
    if (!isUpload(value)) return null;
    const file = value as File;
    if (file.size === 0) return null;
    const extension = extname(file.name) || ".jpg";
    const name = `${slug}-${suffix}${extension}`;
    return await uploadObject(storageProjectId, storageBucket, name, file);
  }

  const uploadedPosterUrl = await maybeUploadFile(posterFile, "poster");
  const uploadedBackdropUrl = await maybeUploadFile(backdropFile, "backdrop");
  posterUrl = uploadedPosterUrl ?? posterUrl;
  backdropUrl = uploadedBackdropUrl ?? backdropUrl;

  const [created] = await db
    .insert(titles)
    .values({
      slug,
      title,
      synopsis,
      type,
      genre,
      year,
      durationMinutes,
      rating,
      posterUrl,
      backdropUrl,
      trailerUrl,
      isOriginal,
      status,
    })
    .returning({ id: titles.id });

  await logAdminAction({
    actor: { id: actor.id, name: actor.displayName, email: actor.email },
    action: "title.created",
    targetType: "title",
    targetId: created.id,
    targetLabel: title,
    metadata: { type, status, genre },
  });

  revalidatePath("/admin/titles");
  revalidatePath("/browse");
  redirect(`/admin/titles?created=${created.id}`);
}
