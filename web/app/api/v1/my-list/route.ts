import { NextRequest, NextResponse } from "next/server";
import { apiRoute, jsonError } from "@/lib/api-auth";
import { getMyListTitles, addToMyList } from "@/lib/my-list";
import { formatDuration } from "@/lib/titles";

export const GET = apiRoute(async (_req, { session }) => {
  const items = await getMyListTitles(session!.sub);
  return NextResponse.json({
    items: items.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      genre: t.genre,
      type: t.type,
      year: t.year,
      durationMinutes: t.durationMinutes,
      durationLabel: formatDuration(t.durationMinutes),
      posterUrl: t.posterUrl,
      isOriginal: t.isOriginal,
      addedAt: t.addedAt,
    })),
  });
}, { requireAuth: true });

export const POST = apiRoute(async (req: NextRequest, { session }) => {
  let body: { titleId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("invalid_body", 400);
  }

  const titleId = body.titleId?.trim();
  if (!titleId) return jsonError("missing_title_id", 400);

  await addToMyList(session!.sub, titleId);
  return NextResponse.json({ ok: true }, { status: 201 });
}, { requireAuth: true });
