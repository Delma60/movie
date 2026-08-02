import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoPlayer } from "@/components/VideoPlayer";
import { getWatchData, formatDuration } from "@/lib/titles";

interface WatchPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ep?: string }>;
}

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const { slug } = await params;
  const { ep } = await searchParams;

  const data = await getWatchData(slug, ep);
  if (!data) notFound();

  const { title, episodes, currentEpisode, videoAsset } = data;

  const variant =
    title.id.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % 6;

  const label = currentEpisode
    ? `S${currentEpisode.season} · E${currentEpisode.episodeNumber} — ${currentEpisode.name}`
    : title.title;

  const nextEpisode = currentEpisode
    ?
        episodes.find(
          (e) =>
            e.season === currentEpisode.season &&
            e.episodeNumber === currentEpisode.episodeNumber + 1
        ) ??
        episodes.find(
          (e) => e.season === currentEpisode.season + 1 && e.episodeNumber === 1
        ) ??
        null
    : null;

  return (
    <main className="vp-root vp-watch-page">
      <div className="vp-watch-topbar">
        <Link href={`/title/${title.slug}`} className="vp-watch-back">
          ← {title.title}
        </Link>
      </div>

      <VideoPlayer src={videoAsset?.sourceUrl} variant={variant} label={label} />

      <div className="vp-watch-info">
        <div className="vp-watch-info-main">
          <h1 className="vp-watch-title">{label}</h1>
          {currentEpisode?.synopsis ? (
            <p className="vp-watch-synopsis">{currentEpisode.synopsis}</p>
          ) : (
            title.synopsis && <p className="vp-watch-synopsis">{title.synopsis}</p>
          )}
        </div>
        {nextEpisode && (
          <Link
            href={`/watch/${title.slug}?ep=${nextEpisode.id}`}
            className="vp-btn vp-btn-secondary vp-watch-next"
          >
            Next: E{nextEpisode.episodeNumber} ▶
          </Link>
        )}
      </div>

      {episodes.length > 0 && (
        <section className="vp-episodes vp-watch-episodes">
          <div className="vp-row-head">
            <span className="vp-row-eyebrow">Episodes</span>
            <span className="vp-row-rule" />
          </div>
          <ol className="vp-episode-list">
            {episodes.map((e) => {
              const active = currentEpisode?.id === e.id;
              return (
                <li key={e.id} className={`vp-episode-row${active ? " active" : ""}`}>
                  <span className="vp-episode-number">{e.episodeNumber}</span>
                  <div className="vp-episode-info">
                    <span className="vp-episode-title">{e.name}</span>
                    {e.synopsis && (
                      <span className="vp-episode-synopsis">{e.synopsis}</span>
                    )}
                  </div>
                  <span className="vp-episode-duration">
                    {formatDuration(e.durationMinutes) ?? "—"}
                  </span>
                  {active ? (
                    <span className="vp-episode-playing" aria-label="Now playing">
                      ●
                    </span>
                  ) : (
                    <Link
                      href={`/watch/${title.slug}?ep=${e.id}`}
                      className="vp-icon-btn vp-episode-play"
                      aria-label={`Play ${e.name}`}
                    >
                      ▶
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </main>
  );
}
