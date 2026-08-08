/**
 * Seed the database with demo content.
 *
 * Run with: npm run db:seed
 *
 * This is a destructive dev-only seed: it wipes the tables it touches
 * before inserting, so it's safe to re-run repeatedly against a dev/
 * preview database. Do NOT point this at production.
 */
import "dotenv/config";
import { hash } from "bcryptjs";
import { db } from "./index";
import {
  users,
  titles,
  episodes,
  videoAssets,
  watchProgress,
  myList,
  subscriptions,
} from "./schema";

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("Seeding database...");

  // -------------------------------------------------------
  // Reset (dev only — order matters for FK constraints)
  // -------------------------------------------------------
  await db.delete(watchProgress);
  await db.delete(myList);
  await db.delete(subscriptions);
  await db.delete(videoAssets);
  await db.delete(episodes);
  await db.delete(titles);
  await db.delete(users);

  // -------------------------------------------------------
  // Users
  // -------------------------------------------------------
  const passwordHash = await hash("password123", 10);

  const [admin, editor, demoUser] = await db
    .insert(users)
    .values([
      {
        email: "admin@velvet.app",
        passwordHash,
        displayName: "Admin",
        role: "admin",
      },
      {
        email: "editor@velvet.app",
        passwordHash,
        displayName: "Content Editor",
        role: "editor",
      },
      {
        email: "demo@velvet.app",
        passwordHash,
        displayName: "Demo Viewer",
        role: "user",
      },
    ])
    .returning();

  console.log(`Created ${3} users`);

  // -------------------------------------------------------
  // Titles — movies (from TRENDING / NEW_RELEASES mock data)
  // -------------------------------------------------------
  const movieData = [
    { title: "Glass Horizon", genre: "Sci-Fi", year: 2026, durationMinutes: 128, rating: "16+" },
    { title: "The Long Ferry", genre: "Drama", year: 2025, durationMinutes: 107 },
    { title: "Ashes of Callisto", genre: "Sci-Fi", year: 2026, durationMinutes: 141, rating: "13+" },
    { title: "A Quiet Currency", genre: "Thriller", year: 2025, durationMinutes: 119 },
    { title: "Nine Days in Lisbon", genre: "Romance", year: 2024, durationMinutes: 102 },
    { title: "The Understudy", genre: "Drama", year: 2026, durationMinutes: 122 },
    { title: "Paper Moths", genre: "Drama", year: 2026, durationMinutes: 111 },
    { title: "Vantage Point Zero", genre: "Thriller", year: 2026, durationMinutes: 134 },
    { title: "The Hollow Choir", genre: "Horror", year: 2026, durationMinutes: 98, rating: "18+" },
    { title: "Low Tide, High Noon", genre: "Western", year: 2026, durationMinutes: 125 },
    { title: "Static & Season", genre: "Drama", year: 2026, durationMinutes: 109 },
    { title: "The Quiet Machinist", genre: "Drama", year: 2026, durationMinutes: 116 },
    { title: "Concrete & Marigold", genre: "Drama", year: 2026, durationMinutes: 118, isOriginal: true },
    { title: "The Signal Between Us", genre: "Sci-Fi", year: 2025, durationMinutes: 121 },
    { title: "Orbital Drift", genre: "Sci-Fi", year: 2024, durationMinutes: 115 },
    { title: "Half-Light", genre: "Mystery", year: 2026, durationMinutes: 130 },
    { title: "The Last Transmission", genre: "Thriller", year: 2025, durationMinutes: 107 },
    { title: "Tomorrow's Static", genre: "Sci-Fi", year: 2026, durationMinutes: 120 },
    { title: "Nightfall in Marseille", genre: "Thriller", year: 2025, durationMinutes: 114 },
    { title: "The Cartographer's Silence", genre: "Drama", year: 2025, durationMinutes: 123 },
    { title: "Salt & Static", genre: "Sci-Fi", year: 2026, durationMinutes: 48 },
    { title: "Meridian", genre: "Sci-Fi", year: 2026, durationMinutes: 131, rating: "16+", isOriginal: true },
  ] as const;

  const insertedMovies = await db
    .insert(titles)
    .values(
      movieData.map((m) => ({
        slug: slugify(m.title),
        title: m.title,
        synopsis: `${m.title} — synopsis coming soon.`,
        type: "movie" as const,
        genre: m.genre,
        year: m.year,
        durationMinutes: m.durationMinutes,
        rating: "rating" in m ? m.rating : "13+",
        isOriginal: "isOriginal" in m ? m.isOriginal : false,
        status: "published" as const,
      }))
    )
    .returning();

  // -------------------------------------------------------
  // Titles — series (from ORIGINALS mock data)
  // -------------------------------------------------------
  const seriesData = [
    { title: "Winter Palace", genre: "Period Drama", episodeCount: 6 },
    { title: "The Ferryman's Daughter", genre: "Mystery", episodeCount: 8 },
    { title: "Elegy for Tomorrow", genre: "Sci-Fi", episodeCount: 5 },
    { title: "The Unreliable Witness", genre: "Crime", episodeCount: 7 },
  ];

  const insertedSeries = [];
  for (const s of seriesData) {
    const [row] = await db
      .insert(titles)
      .values({
        slug: slugify(s.title),
        title: s.title,
        synopsis: `${s.title} — synopsis coming soon.`,
        type: "series",
        genre: s.genre,
        year: 2026,
        rating: "16+",
        isOriginal: true,
        status: "published",
      })
      .returning();
    insertedSeries.push({ ...row, episodeCount: s.episodeCount });
  }

  console.log(
    `Created ${insertedMovies.length} movies and ${insertedSeries.length} series`
  );

  // -------------------------------------------------------
  // Episodes + video assets for series
  // -------------------------------------------------------
  for (const series of insertedSeries) {
    for (let ep = 1; ep <= series.episodeCount; ep++) {
      const [episode] = await db
        .insert(episodes)
        .values({
          titleId: series.id,
          season: 1,
          episodeNumber: ep,
          name: `Episode ${ep}`,
          durationMinutes: 45,
        })
        .returning();

      await db.insert(videoAssets).values({
        episodeId: episode.id,
        sourceUrl: `https://cdn.example.com/${series.slug}/s1e${ep}.m3u8`,
        status: "ready",
        durationSeconds: 45 * 60,
      });
    }
  }

  // Video assets for movies
  await db.insert(videoAssets).values(
    insertedMovies.map((m) => ({
      titleId: m.id,
      sourceUrl: `https://cdn.example.com/${m.slug}.m3u8`,
      status: "ready" as const,
      durationSeconds: (m.durationMinutes ?? 100) * 60,
    }))
  );

  // -------------------------------------------------------
  // Continue Watching (demo user)
  // -------------------------------------------------------
  const findMovie = (title: string) =>
    insertedMovies.find((m) => m.title === title)!;

  await db.insert(watchProgress).values([
    {
      userId: demoUser.id,
      titleId: findMovie("Nightfall in Marseille").id,
      secondsWatched: Math.round(114 * 60 * 0.62),
    },
    {
      userId: demoUser.id,
      titleId: findMovie("The Cartographer's Silence").id,
      secondsWatched: Math.round(123 * 60 * 0.3),
    },
    {
      userId: demoUser.id,
      titleId: findMovie("Salt & Static").id,
      secondsWatched: Math.round(48 * 60 * 0.88),
    },
  ]);

  // -------------------------------------------------------
  // My List (demo user)
  // -------------------------------------------------------
  await db.insert(myList).values([
    { userId: demoUser.id, titleId: findMovie("Meridian").id },
    { userId: demoUser.id, titleId: findMovie("Glass Horizon").id },
  ]);

  // -------------------------------------------------------
  // Subscription (demo user)
  // -------------------------------------------------------
  await db.insert(subscriptions).values({
    userId: demoUser.id,
    plan: "premium",
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  console.log("Seed complete.");
  console.log("Login with: demo@velvet.app / password123 (role: user)");
  console.log("Admin login: admin@velvet.app / password123 (role: admin)");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
