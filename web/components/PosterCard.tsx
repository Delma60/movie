import Link from "next/link";
import { Play } from "lucide-react";

export interface PosterItem {
  title: string;
  genre: string;
  meta: string;
  badge?: string;
  progress?: number;
  href?: string;
}

export function PosterCard({
  title,
  genre,
  meta,
  badge,
  progress,
  variant,
  href,
}: PosterItem & { variant: number; href?: string }) {
  const initial = title.trim()[0];

  const card = (
    <div className={`vp-poster vp-variant-${variant % 6}`}>
      <div className="vp-poster-top">
        <span className="vp-poster-eyebrow">{genre}</span>
        {badge && (
          <span className={`vp-badge vp-badge-${badge.toLowerCase()}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="vp-poster-initial" aria-hidden="true">
        {initial}
      </div>
      <div className="vp-poster-footer">
        <div className="vp-poster-title">{title}</div>
        <div className="vp-poster-meta">{meta}</div>
      </div>
      <div className="vp-poster-play" aria-hidden="true">
        <Play size={18} strokeWidth={2.25} />
      </div>
      {typeof progress === "number" && (
        <div className="vp-progress-track">
          <div className="vp-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );

  return (
    <div className="vp-card">
      {href ? (
        <Link href={href} className="vp-poster-link">
          {card}
        </Link>
      ) : (
        card
      )}
    </div>
  );
}
