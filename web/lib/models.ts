export type TitleStatus = "draft" | "published";
export type UserRole = "user" | "editor" | "admin";
export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "trialing";

export interface Title {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  genre: string[];
  year: number;
  duration: string;
  rating: string;
  poster_url: string;
  backdrop_url: string;
  trailer_url?: string;
  status: TitleStatus;
  created_at: string;
}

export interface Episode {
  id: string;
  title_id: string;
  season: number;
  episode_number: number;
  title: string;
  video_url: string;
  duration: string;
}

export interface VideoAsset {
  id: string;
  title_id?: string;
  episode_id?: string;
  source_url: string;
  resolution: string;
  encoding_status: "pending" | "processing" | "ready" | "failed";
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  created_at: string;
}

export interface WatchProgress {
  user_id: string;
  title_id?: string;
  episode_id?: string;
  seconds_watched: number;
  updated_at: string;
}

export interface MyListItem {
  user_id: string;
  title_id: string;
}

export interface Subscription {
  user_id: string;
  plan: string;
  status: SubscriptionStatus;
  renews_at: string;
}

export const sampleTitles: Title[] = [
  {
    id: "title-1",
    slug: "meridian",
    title: "Meridian",
    synopsis:
      "A navigator wakes with no memory of the voyage and a ship that insists it never left port.",
    genre: ["Sci-Fi", "Mystery"],
    year: 2026,
    duration: "2h 11m",
    rating: "16+",
    poster_url: "/images/posters/meridian.jpg",
    backdrop_url: "/images/backdrops/meridian.jpg",
    trailer_url: "https://youtu.be/example-meridian",
    status: "published",
    created_at: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "title-2",
    slug: "nightfall-in-marseille",
    title: "Nightfall in Marseille",
    synopsis:
      "A thief finds that a single heist can rewrite a city's secrets and the shadows that guard them.",
    genre: ["Thriller"],
    year: 2025,
    duration: "1h 54m",
    rating: "14+",
    poster_url: "/images/posters/nightfall-in-marseille.jpg",
    backdrop_url: "/images/backdrops/nightfall-in-marseille.jpg",
    trailer_url: "https://youtu.be/example-nightfall",
    status: "published",
    created_at: "2026-05-20T10:00:00.000Z",
  },
  {
    id: "title-3",
    slug: "winter-palace",
    title: "Winter Palace",
    synopsis:
      "An original historical drama following a fractured court that must choose between honor and survival.",
    genre: ["Period Drama"],
    year: 2026,
    duration: "6 Episodes",
    rating: "16+",
    poster_url: "/images/posters/winter-palace.jpg",
    backdrop_url: "/images/backdrops/winter-palace.jpg",
    trailer_url: "https://youtu.be/example-winter-palace",
    status: "published",
    created_at: "2026-04-14T09:30:00.000Z",
  },
];
