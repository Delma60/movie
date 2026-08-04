"use client";
import Link from "next/link";
import { PosterCard, PosterItem } from "@/components/PosterCard";
import React from "react";

/* ---------------------------------------------------------
   VELVET — premium streaming homepage
   Fictional brand, fictional titles, no real IP referenced.
--------------------------------------------------------- */

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Movies", href: "/browse?type=movie" },
  { label: "Series", href: "/browse?type=series" },
  { label: "My List", href: "/my-list" },
];

const CONTINUE_WATCHING = [
  {
    title: "Nightfall in Marseille",
    genre: "Thriller",
    meta: "1h 54m · Resume",
    progress: 62,
    href: "/title/nightfall-in-marseille",
  },
  {
    title: "The Cartographer's Silence",
    genre: "Drama",
    meta: "2h 03m · Resume",
    progress: 30,
    href: "/title/the-cartographers-silence",
  },
  {
    title: "Salt & Static",
    genre: "Sci-Fi",
    meta: "48m · Resume",
    progress: 88,
    href: "/title/salt-and-static",
  },
];

const TRENDING = [
  { title: "Glass Horizon", genre: "Sci-Fi", meta: "2h 08m · 2026", href: "/title/glass-horizon" },
  { title: "The Long Ferry", genre: "Drama", meta: "1h 47m · 2025", href: "/title/the-long-ferry" },
  {
    title: "Ashes of Callisto",
    genre: "Sci-Fi",
    meta: "2h 21m · 2026",
    badge: "New",
    href: "/title/ashes-of-callisto",
  },
  { title: "A Quiet Currency", genre: "Thriller", meta: "1h 59m · 2025", href: "/title/a-quiet-currency" },
  { title: "Nine Days in Lisbon", genre: "Romance", meta: "1h 42m · 2024", href: "/title/nine-days-in-lisbon" },
  { title: "The Understudy", genre: "Drama", meta: "2h 02m · 2026", href: "/title/the-understudy" },
];

const NEW_RELEASES = [
  { title: "Paper Moths", genre: "Drama", meta: "1h 51m · 2026", badge: "New", href: "/title/paper-moths" },
  {
    title: "Vantage Point Zero",
    genre: "Thriller",
    meta: "2h 14m · 2026",
    badge: "New",
    href: "/title/vantage-point-zero",
  },
  {
    title: "The Hollow Choir",
    genre: "Horror",
    meta: "1h 38m · 2026",
    badge: "New",
    href: "/title/the-hollow-choir",
  },
  { title: "Low Tide, High Noon", genre: "Western", meta: "2h 05m · 2026", href: "/title/low-tide-high-noon" },
  { title: "Static & Season", genre: "Drama", meta: "1h 49m · 2026", href: "/title/static-season" },
  { title: "The Quiet Machinist", genre: "Drama", meta: "1h 56m · 2026", href: "/title/the-quiet-machinist" },
];

const ORIGINALS = [
  {
    title: "Winter Palace",
    genre: "Period Drama",
    meta: "6 Episodes",
    badge: "Original",
    href: "/title/winter-palace",
  },
  {
    title: "The Ferryman's Daughter",
    genre: "Mystery",
    meta: "8 Episodes",
    badge: "Original",
    href: "/title/the-ferrymans-daughter",
  },
  {
    title: "Concrete & Marigold",
    genre: "Drama",
    meta: "1h 58m",
    badge: "Original",
    href: "/title/concrete-and-marigold",
  },
  {
    title: "Elegy for Tomorrow",
    genre: "Sci-Fi",
    meta: "5 Episodes",
    badge: "Original",
    href: "/title/elegy-for-tomorrow",
  },
  {
    title: "The Unreliable Witness",
    genre: "Crime",
    meta: "7 Episodes",
    badge: "Original",
    href: "/title/the-unreliable-witness",
  },
];

const BECAUSE_YOU_WATCHED = [
  { title: "The Signal Between Us", genre: "Sci-Fi", meta: "2h 01m · 2025", href: "/title/the-signal-between-us" },
  { title: "Orbital Drift", genre: "Sci-Fi", meta: "1h 55m · 2024", href: "/title/orbital-drift" },
  { title: "Half-Light", genre: "Mystery", meta: "2h 10m · 2026", href: "/title/half-light" },
  { title: "The Last Transmission", genre: "Thriller", meta: "1h 47m · 2025", href: "/title/the-last-transmission" },
  { title: "Tomorrow's Static", genre: "Sci-Fi", meta: "2h 00m · 2026", href: "/title/tomorrows-static" },
];

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
  return (
    <div className="vp-root">
      <div className="vp-grain" />

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
            <Link href="/watch/meridian" className="vp-btn vp-btn-primary">
              ▶ Play
            </Link>
            <Link href="/title/meridian" className="vp-btn vp-btn-secondary">
              ⓘ More Info
            </Link>
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
