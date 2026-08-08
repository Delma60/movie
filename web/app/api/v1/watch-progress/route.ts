import { NextRequest, NextResponse } from "next/server";
import { apiRoute, jsonError } from "@/lib/api-auth";
import { listWatchProgress, upsertWatchProgress } from "@/lib/watch-progress";

export const GET = apiRoute(async (_req, { session }) => {
  const rows = await listWatchProgress(session!.sub);
  return NextResponse.json({
    progress: rows.map((r) => ({
      titleId: r.titleId,
      episodeId: r.episodeId,
      secondsWatched: r.secondsWatched,
      updatedAt: r.updatedAt,
    })),
  });
}, { requireAuth: true });

export const POST = apiRoute(async (req: NextRequest, { session }) => {
  let body: { titleId?: string; episodeId?: string; secondsWatched?: number };
  try {
    body = await req.json();
  } catch {
    return jsonError("invalid_body", 400);
  }

  const secondsWatched = Number(body.secondsWatched);
  if (!Number.isFinite(secondsWatched) || secondsWatched < 0) {
    return jsonError("invalid_seconds_watched", 400);
  }
  if (!body.titleId && !body.episodeId) return jsonError("missing_target", 400);

  await upsertWatchProgress({
    userId: session!.sub,
    titleId: body.titleId,
    episodeId: body.episodeId,
    secondsWatched,
  });

  return NextResponse.json({ ok: true });
}, { requireAuth: true });
