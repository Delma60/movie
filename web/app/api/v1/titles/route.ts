import { NextRequest, NextResponse } from "next/server";
import { apiRoute } from "@/lib/api-auth";
import { getBrowseTitles, searchTitles, formatDuration, type TitleType } from "@/lib/titles";
import type { BrowseSort } from "@/lib/browse-options";

const VALID_TYPES: TitleType[] = ["movie", "series"];
const VALID_SORTS: BrowseSort[] = ["newest", "oldest", "title-asc", "title-desc"];

export const GET = apiRoute(async (req: NextRequest) => {
  const params = req.nextUrl.searchParams;
  const q = params.get("q")?.trim();

  const results = q
    ? await searchTitles(q, Number(params.get("limit") ?? 24))
    : await getBrowseTitles({
        genre: params.get("genre") ?? undefined,
        year: params.get("year") ? Number(params.get("year")) : undefined,
        type: VALID_TYPES.includes(params.get("type") as TitleType)
          ? (params.get("type") as TitleType)
          : undefined,
        sort: VALID_SORTS.includes(params.get("sort") as BrowseSort)
          ? (params.get("sort") as BrowseSort)
          : "newest",
      });

  return NextResponse.json({
    results: results.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      genre: t.genre,
      type: t.type,
      year: t.year,
      durationMinutes: t.durationMinutes,
      durationLabel: formatDuration(t.durationMinutes),
      rating: t.rating,
      posterUrl: t.posterUrl,
      backdropUrl: t.backdropUrl,
      isOriginal: t.isOriginal,
    })),
  });
});
