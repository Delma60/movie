"use client";
import React, { useEffect, useState } from "react";

/* ---------------------------------------------------------
   VELVET — premium streaming homepage
   Fictional brand, fictional titles, no real IP referenced.
--------------------------------------------------------- */

const NAV_LINKS = ["Home", "Movies", "Series", "My List"];

const CONTINUE_WATCHING = [
  {
    title: "Nightfall in Marseille",
    genre: "Thriller",
    meta: "1h 54m · Resume",
    progress: 62,
  },
  {
    title: "The Cartographer's Silence",
    genre: "Drama",
    meta: "2h 03m · Resume",
    progress: 30,
  },
  {
    title: "Salt & Static",
    genre: "Sci-Fi",
    meta: "48m · Resume",
    progress: 88,
  },
];

const TRENDING = [
  { title: "Glass Horizon", genre: "Sci-Fi", meta: "2h 08m · 2026" },
  { title: "The Long Ferry", genre: "Drama", meta: "1h 47m · 2025" },
  {
    title: "Ashes of Callisto",
    genre: "Sci-Fi",
    meta: "2h 21m · 2026",
    badge: "New",
  },
  { title: "A Quiet Currency", genre: "Thriller", meta: "1h 59m · 2025" },
  { title: "Nine Days in Lisbon", genre: "Romance", meta: "1h 42m · 2024" },
  { title: "The Understudy", genre: "Drama", meta: "2h 02m · 2026" },
];

const NEW_RELEASES = [
  { title: "Paper Moths", genre: "Drama", meta: "1h 51m · 2026", badge: "New" },
  {
    title: "Vantage Point Zero",
    genre: "Thriller",
    meta: "2h 14m · 2026",
    badge: "New",
  },
  {
    title: "The Hollow Choir",
    genre: "Horror",
    meta: "1h 38m · 2026",
    badge: "New",
  },
  { title: "Low Tide, High Noon", genre: "Western", meta: "2h 05m · 2026" },
  { title: "Static & Season", genre: "Drama", meta: "1h 49m · 2026" },
  { title: "The Quiet Machinist", genre: "Drama", meta: "1h 56m · 2026" },
];

const ORIGINALS = [
  {
    title: "Winter Palace",
    genre: "Period Drama",
    meta: "6 Episodes",
    badge: "Original",
  },
  {
    title: "The Ferryman's Daughter",
    genre: "Mystery",
    meta: "8 Episodes",
    badge: "Original",
  },
  {
    title: "Concrete & Marigold",
    genre: "Drama",
    meta: "1h 58m",
    badge: "Original",
  },
  {
    title: "Elegy for Tomorrow",
    genre: "Sci-Fi",
    meta: "5 Episodes",
    badge: "Original",
  },
  {
    title: "The Unreliable Witness",
    genre: "Crime",
    meta: "7 Episodes",
    badge: "Original",
  },
];

const BECAUSE_YOU_WATCHED = [
  { title: "The Signal Between Us", genre: "Sci-Fi", meta: "2h 01m · 2025" },
  { title: "Orbital Drift", genre: "Sci-Fi", meta: "1h 55m · 2024" },
  { title: "Half-Light", genre: "Mystery", meta: "2h 10m · 2026" },
  { title: "The Last Transmission", genre: "Thriller", meta: "1h 47m · 2025" },
  { title: "Tomorrow's Static", genre: "Sci-Fi", meta: "2h 00m · 2026" },
];

interface PosterItem {
  title: string;
  genre: string;
  meta: string;
  badge?: string;
  progress?: number;
}

function PosterCard({
  title,
  genre,
  meta,
  badge,
  progress,
  variant,
}: PosterItem & { variant: number }) {
  const initial = title.trim()[0];
  return (
    <div className="vp-card">
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
          ▶
        </div>
        {typeof progress === "number" && (
          <div className="vp-progress-track">
            <div
              className="vp-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ eyebrow, items }: { eyebrow: string; items: PosterItem[] }) {
  return (
    <section className="vp-row">
      <div className="vp-row-head">
        <span className="vp-row-eyebrow">{eyebrow}</span>
        <span className="vp-row-rule" />
      </div>
      <div className="vp-row-scroll">
        {items.map((it, i) => (
          <PosterCard key={it.title} variant={i} {...it} />
        ))}
      </div>
    </section>
  );
}

export default function VelvetHomepage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="vp-root">
      <div className="vp-grain" />

      <nav className={`vp-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="vp-logo">
          VEL<span>VET</span>
        </div>
        <ul className="vp-nav-links">
          {NAV_LINKS.map((l) => (
            <li key={l}>
              <a href="#">{l}</a>
            </li>
          ))}
        </ul>
        <div className="vp-nav-right">
          <button className="vp-icon-btn" aria-label="Search">
            ⌕
          </button>
          <button className="vp-icon-btn" aria-label="Notifications">
            ◔
          </button>
          <div className="vp-avatar" />
        </div>
      </nav>

      <header className="vp-hero">
        <div className="vp-hero-bg" />
        <div className="vp-hero-scrim" />
        <div className="vp-hero-content">
          <span className="vp-eyebrow">Velvet Original</span>
          <h1 className="vp-hero-title">Meridian</h1>
          <div className="vp-hero-meta">
            <span>Sci-Fi · Mystery</span>
            <span className="dot" />
            <span>2h 11m</span>
            <span className="dot" />
            <span>2026</span>
            <span className="dot" />
            <span>16+</span>
          </div>
          <p className="vp-hero-tagline">
            A navigator wakes with no memory of the voyage and a ship that
            insists it never left port. Every horizon hides a choice.
          </p>
          <div className="vp-hero-actions">
            <button className="vp-btn vp-btn-primary">▶ Play</button>
            <button className="vp-btn vp-btn-secondary">ⓘ More Info</button>
          </div>
        </div>
      </header>

      <main className="vp-rows">
        <Row eyebrow="Continue Watching" items={CONTINUE_WATCHING} />
        <Row eyebrow="Trending Now" items={TRENDING} />
        <Row eyebrow="New Releases" items={NEW_RELEASES} />
        <Row eyebrow="Velvet Originals" items={ORIGINALS} />
        <Row
          eyebrow="Because You Watched Meridian"
          items={BECAUSE_YOU_WATCHED}
        />
      </main>

      <footer className="vp-footer">
        <ul className="vp-footer-links">
          <li>
            <a href="#">About</a>
          </li>
          <li>
            <a href="#">Help Center</a>
          </li>
          <li>
            <a href="#">Terms</a>
          </li>
          <li>
            <a href="#">Privacy</a>
          </li>
        </ul>
        <span className="vp-footer-copy">© 2026 Velvet Streaming</span>
      </footer>
    </div>
  );
}
