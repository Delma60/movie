import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAd } from "@/lib/actions/admin-ads";
import { getTargetTitleOptions } from "@/lib/admin-ads";
import type { AdPlacement } from "@/lib/db/schema";

const VALID_PLACEMENTS: AdPlacement[] = ["homepage", "title_page", "browse"];

const ERRORS: Record<string, string> = {
  missing_fields: "Headline, CTA text, and CTA URL are required.",
  invalid_placement: "Choose a valid placement.",
  invalid_url: "Enter a valid CTA URL that begins with http:// or https://.",
  invalid_title: "Choose a valid title target or leave it empty.",
};

interface AdminNewAdPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminNewAdPage({ searchParams }: AdminNewAdPageProps) {
  await requireRole("admin", "/admin");

  const { error } = await searchParams;
  const message = error ? ERRORS[error] ?? "Couldn't create the ad." : null;
  const titleOptions = await getTargetTitleOptions();

  return (
    <main className="admin-page admin-form-page">
      <div className="admin-page-head">
        <div>
          <Link href="/admin/ads" className="admin-back-link">
            <ArrowLeft size={14} strokeWidth={2.25} />
            Ads
          </Link>
          <h1>Add Ad</h1>
          <p>Create a new placement for the Velvet site.</p>
        </div>
      </div>

      {message && <div className="admin-form-error">{message}</div>}

      <form action={createAd} className="admin-form admin-panel">
        <div className="admin-field">
          <label htmlFor="headline">Headline</label>
          <input id="headline" name="headline" type="text" required autoFocus />
        </div>

        <div className="admin-field">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} />
        </div>

        <div className="admin-field-row">
          <div className="admin-field">
            <label htmlFor="placement">Placement</label>
            <select id="placement" name="placement" defaultValue="homepage">
              {VALID_PLACEMENTS.map((placement) => (
                <option key={placement} value={placement}>
                  {placement === "homepage"
                    ? "Homepage"
                    : placement === "title_page"
                    ? "Title page"
                    : "Browse"}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="titleId">Target title</label>
            <select id="titleId" name="titleId" defaultValue="">
              <option value="">None</option>
              {titleOptions.map((title) => (
                <option key={title.id} value={title.id}>
                  {title.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-field-row">
          <div className="admin-field">
            <label htmlFor="ctaText">Call to action</label>
            <input id="ctaText" name="ctaText" type="text" required />
          </div>
          <div className="admin-field">
            <label htmlFor="ctaUrl">CTA URL</label>
            <input id="ctaUrl" name="ctaUrl" type="text" required />
          </div>
        </div>

        <label className="admin-checkbox-field">
          <input type="checkbox" name="active" defaultChecked />
          <span>Active</span>
        </label>

        <div className="admin-form-actions">
          <Link href="/admin/ads" className="admin-btn admin-btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="admin-btn admin-btn-primary">
            Create Ad
          </button>
        </div>
      </form>
    </main>
  );
}
