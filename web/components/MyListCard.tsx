// web/components/MyListCard.tsx
"use client";

import { useTransition, type MouseEvent } from "react";
import { PosterCard, type PosterItem } from "@/components/PosterCard";
import { removeFromMyListAction } from "@/lib/actions/my-list";

interface MyListCardProps extends PosterItem {
  variant: number;
  href: string;
  titleId: string;
}

export function MyListCard({ titleId, variant, href, ...item }: MyListCardProps) {
  const [isPending, startTransition] = useTransition();

  function handleRemove(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(() => {
      void removeFromMyListAction(titleId);
    });
  }

  return (
    <div className={`vp-mylist-card${isPending ? " is-removing" : ""}`}>
      <PosterCard variant={variant} href={href} {...item} />
      <button
        type="button"
        className="vp-mylist-remove"
        onClick={handleRemove}
        disabled={isPending}
        aria-label={`Remove ${item.title} from My List`}
      >
        ✕
      </button>
    </div>
  );
}
