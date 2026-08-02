import Link from "next/link";

export default function NotFound() {
  return (
    <main className="vp-root vp-notfound">
      <div className="vp-grain" />
      <div className="vp-notfound-content">
        <span className="vp-notfound-code">404</span>
        <h1 className="vp-notfound-title">This reel is missing</h1>
        <p className="vp-notfound-text">
          The title you&apos;re looking for isn&apos;t in the Velvet catalogue —
          it may have been removed, renamed, or never released.
        </p>
        <div className="vp-notfound-actions">
          <Link href="/" className="vp-btn vp-btn-primary">
            Back to Home
          </Link>
          <Link href="/browse" className="vp-btn vp-btn-secondary">
            Browse Catalogue
          </Link>
        </div>
      </div>
    </main>
  );
}
