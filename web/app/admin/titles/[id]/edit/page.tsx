import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { updateTitle } from "@/lib/actions/admin-titles";
import { attachVideoAsset } from "@/lib/actions/admin-video";
import { getAdminTitleById } from "@/lib/admin-titles";
import { db, videoAssets } from "@/lib/db";
import { VideoStatusToggle } from "@/components/admin/VideoStatusToggle";

const ERRORS: Record<string, string> = {
  missing_fields: "Title and genre are required.",
  invalid_type: "Choose a valid type.",
  invalid_status: "Choose a valid status.",
  invalid_slug: "Couldn't generate a valid slug from that title.",
  slug_taken: "Another title already uses that slug.",
  invalid_year: "Enter a valid release year.",
  invalid_duration: "Enter a valid duration in minutes.",
  missing_target: "Couldn't determine which title to attach video to.",
  missing_source: "Upload a file or paste a source URL.",
};

interface AdminEditTitlePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; video?: string }>;
}

export default async function AdminEditTitlePage({
  params,
  searchParams,
}: AdminEditTitlePageProps) {
  const { id } = await params;
  const { error, video } = await searchParams;
  const message = error ? (ERRORS[error] ?? "Couldn't save the title.") : null;

  const title = await getAdminTitleById(id);
  if (!title) notFound();

  const [asset] = await db
    .select()
    .from(videoAssets)
    .where(eq(videoAssets.titleId, id))
    .limit(1);

  const updateTitleWithId = updateTitle.bind(null, id);

  return (
    <main className="admin-page admin-form-page">
      <div className="admin-page-head">
        <div>
          <Link href="/admin/titles" className="admin-back-link">
            <ArrowLeft size={14} strokeWidth={2.25} />
            Titles
          </Link>
          <h1>Edit Title</h1>
          <p>{title.title}</p>
        </div>
      </div>

      {message && <div className="admin-form-error">{message}</div>}
      {video === "attached" && (
        <div className="admin-form-success">Video attached.</div>
      )}

      <form
        action={updateTitleWithId}
        className="admin-form admin-panel"
        encType="multipart/form-data"
      >
        <div className="admin-field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={title.title}
            required
            autoFocus
          />
        </div>

        <div className="admin-field-row">
          <div className="admin-field">
            <label htmlFor="type">Type</label>
            <select id="type" name="type" defaultValue={title.type}>
              <option value="movie">Movie</option>
              <option value="series">Series</option>
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={title.status}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="admin-field-row">
          <div className="admin-field">
            <label htmlFor="genre">Genre</label>
            <input id="genre" name="genre" type="text" defaultValue={title.genre} required />
          </div>
          <div className="admin-field">
            <label htmlFor="year">Year</label>
            <input
              id="year"
              name="year"
              type="number"
              min={1888}
              max={2100}
              defaultValue={title.year ?? ""}
            />
          </div>
        </div>

        <div className="admin-field-row">
          <div className="admin-field">
            <label htmlFor="durationMinutes">Duration (minutes)</label>
            <input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              min={1}
              defaultValue={title.durationMinutes ?? ""}
              placeholder="Movies only"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="rating">Rating</label>
            <input id="rating" name="rating" type="text" defaultValue={title.rating ?? ""} />
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="slug">Slug</label>
          <input id="slug" name="slug" type="text" defaultValue={title.slug} />
        </div>

        <div className="admin-field">
          <label htmlFor="synopsis">Synopsis</label>
          <textarea id="synopsis" name="synopsis" rows={4} defaultValue={title.synopsis ?? ""} />
        </div>

        <div className="admin-field-row">
          <div className="admin-field">
            <label htmlFor="posterFile">Replace poster</label>
            <input id="posterFile" name="posterFile" type="file" accept="image/*" />
            {title.posterUrl && (
              <p className="admin-field-help">Current: {title.posterUrl}</p>
            )}
          </div>
          <div className="admin-field">
            <label htmlFor="backdropFile">Replace backdrop</label>
            <input id="backdropFile" name="backdropFile" type="file" accept="image/*" />
            {title.backdropUrl && (
              <p className="admin-field-help">Current: {title.backdropUrl}</p>
            )}
          </div>
        </div>

        <div className="admin-field-row">
          <div className="admin-field">
            <label htmlFor="posterUrl">Poster URL</label>
            <input id="posterUrl" name="posterUrl" type="text" defaultValue={title.posterUrl ?? ""} />
          </div>
          <div className="admin-field">
            <label htmlFor="backdropUrl">Backdrop URL</label>
            <input id="backdropUrl" name="backdropUrl" type="text" defaultValue={title.backdropUrl ?? ""} />
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="trailerUrl">Trailer URL</label>
          <input id="trailerUrl" name="trailerUrl" type="text" defaultValue={title.trailerUrl ?? ""} />
        </div>

        <label className="admin-checkbox-field">
          <input type="checkbox" name="isOriginal" defaultChecked={title.isOriginal} />
          <span>Velvet Original</span>
        </label>

        <div className="admin-form-actions">
          <Link href="/admin/titles" className="admin-btn admin-btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="admin-btn admin-btn-primary">
            Save Changes
          </button>
        </div>
      </form>

      {title.type === "movie" && (
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
            encType="multipart/form-data"
            className="admin-field-row"
            style={{ marginTop: 12 }}
          >
            <input type="hidden" name="titleId" value={title.id} />
            <input type="hidden" name="returnTo" value={`/admin/titles/${title.id}/edit`} />
            <div className="admin-field">
              <label htmlFor="videoFile">Upload video file</label>
              <input id="videoFile" name="videoFile" type="file" accept="video/*" />
            </div>
            <div className="admin-field">
              <label htmlFor="sourceUrl">…or paste a hosted URL</label>
              <input id="sourceUrl" name="sourceUrl" type="text" placeholder="https://cdn.example.com/…" />
            </div>
            <div className="admin-form-actions" style={{ borderTop: "none", paddingTop: 0 }}>
              <button type="submit" className="admin-btn admin-btn-primary">
                {asset ? "Replace Video" : "Attach Video"}
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}
