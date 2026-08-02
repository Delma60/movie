import { requireUserId } from "@/lib/auth";

export default async function MyListPage() {
  const userId = await requireUserId();

  return (
    <main className="vp-root vp-my-list-page">
      <div className="vp-browse-header">
        <h1 className="vp-browse-title">My List</h1>
        <p className="vp-browse-subtitle">Saved titles for {userId}.</p>
      </div>
    </main>
  );
}
