import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PosterCard } from "@/components/PosterCard";
import { addToMyListAction } from "@/lib/actions/my-list";
import {
  getTitleBySlug,
  getEpisodesForTitle,
  getRelatedTitles,
  formatDuration,
} from "@/lib/titles";

interface TitlePageProps {
  params: Promise<{ slug: string }>;
}

function interleaveWithDots(parts: string[]): ReactNode[] {
  return parts.flatMap((part, i) => [
    <span key={`t-${i}`}>{part}</span>,
    ...(i < parts.length - 1 ? [<span key={`d-${i}`} className="dot" />] : []),
  ]);
}

export default async function TitlePage({ params }: TitlePageProps) {
  const { slug } = await params;
  const title = await getTitleBySlug(slug);
  if (!title) notFound();

  const [episodes, related] = await Promise.all([
    title.type === "series"
      ? getEpisodesForTitle(title.id)
      : Promise.resolve([]),
    getRelatedTitles(title),
  ]);

  const variant =
    title.id.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % 6;

  const metaParts = [
    title.genre,
    title.type === "series"
      ? `${episodes.length} Episode${episodes.length === 1 ? "" : "s"}`
      : formatDuration(title.durationMinutes),
    title.year ? String(title.year) : null,
    title.rating,
  ].filter((v): v is string => Boolean(v));

  return (
    <main className="vp-root vp-title-page">
      <div className="vp-grain" />

      <section className="vp-title-hero">
        <div className={`vp-title-hero-bg vp-variant-${variant}`} />
        <div className="vp-title-hero-scrim" />
        <div className="vp-title-hero-content">
          <nav className="vp-breadcrumb" aria-label="Breadcrumb">
            <Link href="/browse">Browse</Link>
            <span>/</span>
            <span aria-current="page">{title.title}</span>
          </nav>

          {title.isOriginal && (
            <span className="vp-eyebrow">Velvet Original</span>
          )}

          <h1 className="vp-title-hero-title">{title.title}</h1>

          <div className="vp-hero-meta">{interleaveWithDots(metaParts)}</div>

          {title.synopsis && (
            <p className="vp-hero-tagline">{title.synopsis}</p>
          )}

          <div className="vp-hero-actions">
            <Link
              href={`/watch/${title.slug}`}
              className="vp-btn vp-btn-primary"
            >
              ▶ Play
            </Link>
            <form action={addToMyListAction} className="vp-inline-form">
              <input type="hidden" name="titleId" value={title.id} />
              <button type="submit" className="vp-btn vp-btn-secondary">
                + My List
              </button>
            </form>
          </div>
        </div>
      </section>

      {title.type === "series" && episodes.length > 0 && (
        <section className="vp-episodes">
          <div className="vp-row-head">
            <span className="vp-row-eyebrow">Episodes</span>
            <span className="vp-row-rule" />
          </div>
          <ol className="vp-episode-list">
            {episodes.map((ep) => (
              <li key={ep.id} className="vp-episode-row">
                <span className="vp-episode-number">{ep.episodeNumber}</span>
                <div className="vp-episode-info">
                  <span className="vp-episode-title">{ep.name}</span>
                  {ep.synopsis && (
                    <span className="vp-episode-synopsis">{ep.synopsis}</span>
                  )}
                </div>
                <span className="vp-episode-duration">
                  {formatDuration(ep.durationMinutes) ?? "—"}
                </span>
                <Link
                  href={`/watch/${title.slug}?ep=${ep.id}`}
                  className="vp-icon-btn vp-episode-play"
                  aria-label={`Play ${ep.name}`}
                >
                  ▶
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {related.length > 0 && (
        <section className="vp-row vp-related-row">
          <div className="vp-row-head">
            <span className="vp-row-eyebrow">More Like This</span>
            <span className="vp-row-rule" />
          </div>
          <div className="vp-row-scroll">
            {related.map((t, i) => (
              <PosterCard
                key={t.id}
                variant={i}
                href={`/title/${t.slug}`}
                title={t.title}
                genre={t.genre}
                meta={
                  t.type === "series"
                    ? String(t.year ?? "")
                    : [formatDuration(t.durationMinutes), t.year]
                        .filter(Boolean)
                        .join(" · ")
                }
                badge={t.isOriginal ? "Original" : undefined}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
