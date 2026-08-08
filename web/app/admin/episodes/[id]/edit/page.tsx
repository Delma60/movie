import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { updateEpisode } from "@/lib/actions/admin-episodes";
import { attachVideoAsset } from "@/lib/actions/admin-video";
import { getAdminEpisodeById } from "@/lib/admin-episodes";
import { db, videoAssets } from "@/lib/db";
import { VideoStatusToggle } from "@/components/admin/VideoStatusToggle";

const ERRORS: Record<string, string> = {
  missing_fields: "Episode title is required.",
  invalid_season: "Enter a valid season number.",
  invalid_episode_number: "Enter a valid episode number.",
  duplicate_episode:
    "That series already has an episode with this season and number.",
  invalid_duration: "Enter a valid duration in minutes.",
  missing_target: "Couldn't determine which episode to attach video to.",
  missing_source: "Upload a file or paste a source URL.",
};

interface AdminEditEpisodePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; video?: string }>;
}

export default async function AdminEditEpisodePage({
  params,
  searchParams,
}: AdminEditEpisodePageProps) {
  const { id } = await params;
  const { error, video } = await searchParams;
  const message = error
    ? (ERRORS[error] ?? "Couldn't save the episode.")
    : null;

  const episode = await getAdminEpisodeById(id);
  if (!episode) notFound();

  const [asset] = await db
    .select()
    .from(videoAssets)
    .where(eq(videoAssets.episodeId, id))
    .limit(1);

  async function updateEpisodeWithId(formData: FormData) {
    "use server";
    await updateEpisode(id, formData);
  }

  return (
    <main className="admin-page admin-form-page">
      <div className="admin-page-head">
        <div>
          <Link href="/admin/episodes" className="admin-back-link">
            <ArrowLeft size={14} strokeWidth={2.25} />
            Episodes
          </Link>
          <h1>Edit Episode</h1>
          <p>
            {episode.titleName} — S{episode.season} · E{episode.episodeNumber}
          </p>
        </div>
      </div>

      {message && <div className="admin-form-error">{message}</div>}
      {video === "attached" && (
        <div className="admin-form-success">Video attached.</div>
      )}

      <form action={updateEpisodeWithId} className="admin-form admin-panel">
        <div className="admin-field-row">
          <div className="admin-field">
            <label htmlFor="season">Season</label>
            <input
              id="season"
              name="season"
              type="number"
              min={1}
              defaultValue={episode.season}
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
              defaultValue={episode.episodeNumber}
              required
            />
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="name">Episode Title</label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={episode.name}
            required
            autoFocus
          />
        </div>

        <div className="admin-field">
          <label htmlFor="durationMinutes">Duration (minutes)</label>
          <input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={1}
            defaultValue={episode.durationMinutes ?? ""}
            placeholder="45"
          />
        </div>

        <div className="admin-field">
          <label htmlFor="synopsis">Synopsis</label>
          <textarea
            id="synopsis"
            name="synopsis"
            rows={4}
            defaultValue={episode.synopsis ?? ""}
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
            Save Changes
          </button>
        </div>
      </form>

      <section className="admin-panel admin-form" style={{ marginTop: 24 }}>
        <div className="admin-panel-head">
          <h2>Video</h2>
        </div>
        {asset ? (
          <div className="admin-field-row">
            <div className="admin-field">
              <label>Status</label>
              <VideoStatusToggle id={asset.id} status={asset.status} />
            </div>
            <div className="admin-field">
              <label>Source</label>
              <p className="admin-table-dim" style={{ wordBreak: "break-all" }}>
                {asset.sourceUrl}
              </p>
            </div>
          </div>
        ) : (
          <p className="admin-empty">No video attached yet.</p>
        )}

        <form
          action={attachVideoAsset}
          className="admin-field-row"
          style={{ marginTop: 12 }}
        >
          <input type="hidden" name="episodeId" value={episode.id} />
          <input
            type="hidden"
            name="returnTo"
            value={`/admin/episodes/${episode.id}/edit`}
          />
          <div className="admin-field">
            <label htmlFor="videoFile">Upload video file</label>
            <input
              id="videoFile"
              name="videoFile"
              type="file"
              accept="video/*"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="sourceUrl">…or paste a hosted URL</label>
            <input
              id="sourceUrl"
              name="sourceUrl"
              type="text"
              placeholder="https://cdn.example.com/…"
            />
          </div>
          <div
            className="admin-form-actions"
            style={{ borderTop: "none", paddingTop: 0 }}
          >
            <button type="submit" className="admin-btn admin-btn-primary">
              {asset ? "Replace Video" : "Attach Video"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
