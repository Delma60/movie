// web/app/admin/episodes/new/page.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createEpisode } from "@/lib/actions/admin-episodes";
import { getSeriesTitlesForFilter } from "@/lib/admin-episodes";

const ERRORS: Record<string, string> = {
  missing_fields: "Series and episode title are required.",
  invalid_title: "Choose a valid series.",
  invalid_season: "Enter a valid season number.",
  invalid_episode_number: "Enter a valid episode number.",
  duplicate_episode:
    "That series already has an episode with this season and number.",
  invalid_duration: "Enter a valid duration in minutes.",
};

interface AdminNewEpisodePageProps {
  searchParams: Promise<{ error?: string; titleId?: string }>;
}

export default async function AdminNewEpisodePage({
  searchParams,
}: AdminNewEpisodePageProps) {
  const { error, titleId } = await searchParams;
  const message = error
    ? (ERRORS[error] ?? "Couldn't create the episode.")
    : null;

  const seriesOptions = await getSeriesTitlesForFilter();

  return (
    <main className="admin-page admin-form-page">
      <div className="admin-page-head">
        <div>
          <Link href="/admin/episodes" className="admin-back-link">
            <ArrowLeft size={14} strokeWidth={2.25} />
            Episodes
          </Link>
          <h1>Add Episode</h1>
          <p>Attach a new episode to a series title.</p>
        </div>
      </div>

      {message && <div className="admin-form-error">{message}</div>}

      {seriesOptions.length === 0 ? (
        <div className="admin-panel admin-empty-block">
          <p className="admin-empty">
            No series yet — create a series title before adding episodes.
          </p>
        </div>
      ) : (
        <form action={createEpisode} className="admin-form admin-panel">
          <div className="admin-field">
            <label htmlFor="titleId">Series</label>
            <select
              id="titleId"
              name="titleId"
              defaultValue={titleId ?? ""}
              required
            >
              <option value="" disabled>
                Select a series…
              </option>
              {seriesOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field-row">
            <div className="admin-field">
              <label htmlFor="season">Season</label>
              <input
                id="season"
                name="season"
                type="number"
                min={1}
                defaultValue={1}
                required
              />
            </div>
            <div className="admin-field">
              <label htmlFor="episodeNumber">Episode Number</label>
              <input
                id="episodeNumber"
                name="episodeNumber"
                type="number"
                min={1}
                required
              />
            </div>
          </div>

          <div className="admin-field">
            <label htmlFor="name">Episode Title</label>
            <input id="name" name="name" type="text" required autoFocus />
          </div>

          <div className="admin-field">
            <label htmlFor="durationMinutes">Duration (minutes)</label>
            <input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              min={1}
              placeholder="45"
            />
          </div>

          <div className="admin-field">
            <label htmlFor="synopsis">Synopsis</label>
            <textarea
              id="synopsis"
              name="synopsis"
              rows={4}
              placeholder="A short synopsis for this episode."
            />
          </div>

          <div className="admin-form-actions">
            <Link
              href="/admin/episodes"
              className="admin-btn admin-btn-secondary"
            >
              Cancel
            </Link>
            <button type="submit" className="admin-btn admin-btn-primary">
              Add Episode
            </button>
          </div>
        </form>
      )}
    </main>
  );
}