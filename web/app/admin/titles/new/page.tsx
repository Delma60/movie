import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createTitle } from "@/lib/actions/admin-titles";

const ERRORS: Record<string, string> = {
  missing_fields: "Title and genre are required.",
  invalid_type: "Choose a valid type.",
  invalid_status: "Choose a valid status.",
  invalid_slug: "Couldn't generate a valid slug from that title.",
  slug_taken:
    "A title with that slug already exists — try a different title or set a custom slug.",
  invalid_year: "Enter a valid release year.",
  invalid_duration: "Enter a valid duration in minutes.",
};

interface AdminNewTitlePageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminNewTitlePage({
  searchParams,
}: AdminNewTitlePageProps) {
  const { error } = await searchParams;
  const message = error
    ? (ERRORS[error] ?? "Couldn't create the title.")
    : null;

  return (
    <main className="admin-page admin-form-page">
      <div className="admin-page-head">
        <div>
          <Link href="/admin/titles" className="admin-back-link">
            <ArrowLeft size={14} strokeWidth={2.25} />
            Titles
          </Link>
          <h1>Add Title</h1>
          <p>Create a new movie or series entry for the catalogue.</p>
        </div>
      </div>

      {message && <div className="admin-form-error">{message}</div>}

      <form
        action={createTitle}
        className="admin-form admin-panel"
        encType="multipart/form-data"
      >
        <div className="admin-field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" required autoFocus />
        </div>

        <div className="admin-field-row">
          <div className="admin-field">
            <label htmlFor="type">Type</label>
            <select id="type" name="type" defaultValue="movie">
              <option value="movie">Movie</option>
              <option value="series">Series</option>
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div className="admin-field-row">
          <div className="admin-field">
            <label htmlFor="genre">Genre</label>
            <input
              id="genre"
              name="genre"
              type="text"
              placeholder="Sci-Fi"
              required
            />
          </div>
          <div className="admin-field">
            <label htmlFor="year">Year</label>
            <input
              id="year"
              name="year"
              type="number"
              min={1888}
              max={2100}
              placeholder="2026"
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
              placeholder="Movies only"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="rating">Rating</label>
            <input id="rating" name="rating" type="text" placeholder="16+" />
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="slug">Slug</label>
          <input
            id="slug"
            name="slug"
            type="text"
            placeholder="auto-generated from title if left blank"
          />
        </div>

        <div className="admin-field">
          <label htmlFor="synopsis">Synopsis</label>
          <textarea
            id="synopsis"
            name="synopsis"
            rows={4}
            placeholder="A short synopsis for the title page."
          />
        </div>

        <div className="admin-field-row">
          <div className="admin-field">
            <label htmlFor="posterFile">Poster upload</label>
            <input
              id="posterFile"
              name="posterFile"
              type="file"
              accept="image/*"
            />
            <p className="admin-field-help">
              Upload a poster image, or provide a public URL below.
            </p>
          </div>
          <div className="admin-field">
            <label htmlFor="backdropFile">Backdrop upload</label>
            <input
              id="backdropFile"
              name="backdropFile"
              type="file"
              accept="image/*"
            />
            <p className="admin-field-help">
              Upload a backdrop image, or provide a public URL below.
            </p>
          </div>
        </div>

        <div className="admin-field-row">
          <div className="admin-field">
            <label htmlFor="posterUrl">Poster URL</label>
            <input
              id="posterUrl"
              name="posterUrl"
              type="text"
              placeholder="/images/posters/…"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="backdropUrl">Backdrop URL</label>
            <input
              id="backdropUrl"
              name="backdropUrl"
              type="text"
              placeholder="/images/backdrops/…"
            />
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="trailerUrl">Trailer URL</label>
          <input
            id="trailerUrl"
            name="trailerUrl"
            type="text"
            placeholder="https://…"
          />
        </div>

        <label className="admin-checkbox-field">
          <input type="checkbox" name="isOriginal" />
          <span>Velvet Original</span>
        </label>

        <div className="admin-form-actions">
          <Link href="/admin/titles" className="admin-btn admin-btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="admin-btn admin-btn-primary">
            Create Title
          </button>
        </div>
      </form>
    </main>
  );
}
