import { NextResponse } from "next/server";
import { apiRoute, jsonError } from "@/lib/api-auth";
import { getTitleBySlug, getEpisodesForTitle, getRelatedTitles, formatDuration } from "@/lib/titles";

export const GET = apiRoute<{ slug: string }>(async (_req, { params }) => {
  const title = await getTitleBySlug(params.slug);
  if (!title) return jsonError("not_found", 404);

  const [episodes, related] = await Promise.all([
    title.type === "series" ? getEpisodesForTitle(title.id) : Promise.resolve([]),
    getRelatedTitles(title),
  ]);

  return NextResponse.json({
    title: {
      id: title.id,
      slug: title.slug,
      title: title.title,
      synopsis: title.synopsis,
      type: title.type,
      genre: title.genre,
      year: title.year,
      durationMinutes: title.durationMinutes,
      durationLabel: formatDuration(title.durationMinutes),
      rating: title.rating,
      posterUrl: title.posterUrl,
      backdropUrl: title.backdropUrl,
      trailerUrl: title.trailerUrl,
      isOriginal: title.isOriginal,
    },
    episodes: episodes.map((e) => ({
      id: e.id,
      season: e.season,
      episodeNumber: e.episodeNumber,
      name: e.name,
      synopsis: e.synopsis,
      durationMinutes: e.durationMinutes,
      durationLabel: formatDuration(e.durationMinutes),
    })),
    related: related.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      genre: t.genre,
      type: t.type,
      year: t.year,
      posterUrl: t.posterUrl,
      isOriginal: t.isOriginal,
    })),
  });
});
