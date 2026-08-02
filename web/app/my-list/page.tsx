// web/app/my-list/page.tsx
import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getMyListTitles } from "@/lib/my-list";
import { MyListCard } from "@/components/MyListCard";
import { formatDuration } from "@/lib/titles";

export default async function MyListPage() {
  const userId = await requireUserId();
  const items = await getMyListTitles(userId);

  return (
    <main className="vp-root vp-browse vp-my-list-page">
      <div className="vp-browse-header">
        <h1 className="vp-browse-title">My List</h1>
        <p className="vp-browse-subtitle">
          {items.length === 0
            ? "Titles you save will show up here."
            : `${items.length} saved title${items.length === 1 ? "" : "s"}.`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="vp-browse-empty">
          <p>Your list is empty. Add titles from Browse to watch them later.</p>
          <Link href="/browse" className="vp-btn vp-btn-primary">
            Browse Catalogue
          </Link>
        </div>
      ) : (
        <div className="vp-browse-grid">
          {items.map((title, index) => {
            const meta =
              title.type === "series"
                ? [title.year, "Series"].filter(Boolean).join(" · ")
                : [formatDuration(title.durationMinutes), title.year]
                    .filter(Boolean)
                    .join(" · ");

            return (
              <MyListCard
                key={title.id}
                titleId={title.id}
                variant={index}
                href={`/title/${title.slug}`}
                title={title.title}
                genre={title.genre}
                meta={meta}
                badge={title.isOriginal ? "Original" : undefined}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
