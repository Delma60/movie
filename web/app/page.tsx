"use client"
import React, { useEffect, useState } from "react";

/* ---------------------------------------------------------
   VELVET — premium streaming homepage
   Fictional brand, fictional titles, no real IP referenced.
--------------------------------------------------------- */

const NAV_LINKS = ["Home", "Movies", "Series", "My List"];

const CONTINUE_WATCHING = [
  { title: "Nightfall in Marseille", genre: "Thriller", meta: "1h 54m · Resume", progress: 62 },
  { title: "The Cartographer's Silence", genre: "Drama", meta: "2h 03m · Resume", progress: 30 },
  { title: "Salt & Static", genre: "Sci-Fi", meta: "48m · Resume", progress: 88 },
];

const TRENDING = [
  { title: "Glass Horizon", genre: "Sci-Fi", meta: "2h 08m · 2026" },
  { title: "The Long Ferry", genre: "Drama", meta: "1h 47m · 2025" },
  { title: "Ashes of Callisto", genre: "Sci-Fi", meta: "2h 21m · 2026", badge: "New" },
  { title: "A Quiet Currency", genre: "Thriller", meta: "1h 59m · 2025" },
  { title: "Nine Days in Lisbon", genre: "Romance", meta: "1h 42m · 2024" },
  { title: "The Understudy", genre: "Drama", meta: "2h 02m · 2026" },
];

const NEW_RELEASES = [
  { title: "Paper Moths", genre: "Drama", meta: "1h 51m · 2026", badge: "New" },
  { title: "Vantage Point Zero", genre: "Thriller", meta: "2h 14m · 2026", badge: "New" },
  { title: "The Hollow Choir", genre: "Horror", meta: "1h 38m · 2026", badge: "New" },
  { title: "Low Tide, High Noon", genre: "Western", meta: "2h 05m · 2026" },
  { title: "Static & Season", genre: "Drama", meta: "1h 49m · 2026" },
  { title: "The Quiet Machinist", genre: "Drama", meta: "1h 56m · 2026" },
];

const ORIGINALS = [
  { title: "Winter Palace", genre: "Period Drama", meta: "6 Episodes", badge: "Original" },
  { title: "The Ferryman's Daughter", genre: "Mystery", meta: "8 Episodes", badge: "Original" },
  { title: "Concrete & Marigold", genre: "Drama", meta: "1h 58m", badge: "Original" },
  { title: "Elegy for Tomorrow", genre: "Sci-Fi", meta: "5 Episodes", badge: "Original" },
  { title: "The Unreliable Witness", genre: "Crime", meta: "7 Episodes", badge: "Original" },
];

const BECAUSE_YOU_WATCHED = [
  { title: "The Signal Between Us", genre: "Sci-Fi", meta: "2h 01m · 2025" },
  { title: "Orbital Drift", genre: "Sci-Fi", meta: "1h 55m · 2024" },
  { title: "Half-Light", genre: "Mystery", meta: "2h 10m · 2026" },
  { title: "The Last Transmission", genre: "Thriller", meta: "1h 47m · 2025" },
  { title: "Tomorrow's Static", genre: "Sci-Fi", meta: "2h 00m · 2026" },
];

function PosterCard({ title, genre, meta, badge, progress, variant }: any) {
  const initial = title.trim()[0];
  return (
    <div className="vp-card">
      <div className={`vp-poster vp-variant-${variant % 6}`}>
        <div className="vp-poster-top">
          <span className="vp-poster-eyebrow">{genre}</span>
          {badge && (
            <span className={`vp-badge vp-badge-${badge.toLowerCase()}`}>{badge}</span>
          )}
        </div>
        <div className="vp-poster-initial" aria-hidden="true">{initial}</div>
        <div className="vp-poster-footer">
          <div className="vp-poster-title">{title}</div>
          <div className="vp-poster-meta">{meta}</div>
        </div>
        <div className="vp-poster-play" aria-hidden="true">▶</div>
        {typeof progress === "number" && (
          <div className="vp-progress-track">
            <div className="vp-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ eyebrow, items }: any) {
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Manrope:wght@400;500;600;700;800&display=swap');

        .vp-root {
          --bg: #0b0b0d;
          --surface: #16161a;
          --text: #f5f4f2;
          --text-dim: #9c9a96;
          --gold: #c9a876;
          --gold-dim: #8a7452;
          --wine: #7a2632;
          --line: rgba(245, 244, 242, 0.09);
          background: var(--bg);
          color: var(--text);
          font-family: 'Manrope', sans-serif;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        .vp-root * { box-sizing: border-box; }

        /* film grain overlay */
        .vp-grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 50;
          opacity: 0.05;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        /* NAV */
        .vp-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 48px;
          transition: background 0.4s ease, padding 0.4s ease, backdrop-filter 0.4s ease;
        }
        .vp-nav.scrolled {
          background: rgba(11, 11, 13, 0.85);
          backdrop-filter: blur(14px);
          padding: 14px 48px;
          border-bottom: 1px solid var(--line);
        }
        .vp-logo {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 22px;
          letter-spacing: 0.12em;
          color: var(--text);
        }
        .vp-logo span { color: var(--gold); }
        .vp-nav-links {
          display: flex;
          gap: 32px;
          list-style: none;
          margin: 0; padding: 0;
        }
        .vp-nav-links a {
          color: var(--text-dim);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.02em;
          transition: color 0.2s ease;
        }
        .vp-nav-links a:hover, .vp-nav-links a:focus-visible { color: var(--text); }
        .vp-nav-right { display: flex; align-items: center; gap: 20px; }
        .vp-icon-btn {
          background: none; border: none; color: var(--text-dim);
          cursor: pointer; font-size: 16px; padding: 6px;
        }
        .vp-icon-btn:hover, .vp-icon-btn:focus-visible { color: var(--text); }
        .vp-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, var(--gold), var(--gold-dim));
        }

        /* HERO */
        .vp-hero {
          position: relative;
          height: 92vh;
          min-height: 560px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }
        .vp-hero-bg {
          position: absolute; inset: -5%;
          background: linear-gradient(140deg, #1b1420 0%, #2c1e2e 35%, #3a2a2e 60%, #201a1c 100%);
          animation: kenburns 22s ease-in-out infinite alternate;
        }
        @keyframes kenburns {
          0% { transform: scale(1) translate(0,0); }
          100% { transform: scale(1.08) translate(-1%, -1%); }
        }
        .vp-hero-scrim {
          position: absolute; inset: 0;
          background:
            linear-gradient(180deg, rgba(11,11,13,0.15) 0%, rgba(11,11,13,0.55) 60%, var(--bg) 100%),
            linear-gradient(90deg, rgba(11,11,13,0.75) 0%, rgba(11,11,13,0.1) 55%);
        }
        .vp-hero-content {
          position: relative;
          z-index: 2;
          padding: 0 48px 72px;
          max-width: 640px;
        }
        .vp-eyebrow {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 18px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--gold-dim);
        }
        .vp-hero-title {
          font-family: 'Fraunces', serif;
          font-weight: 500;
          font-size: clamp(48px, 7vw, 84px);
          line-height: 1.02;
          letter-spacing: -0.01em;
          margin: 0 0 18px;
        }
        .vp-hero-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-dim);
          font-size: 14px;
          margin-bottom: 20px;
        }
        .vp-hero-meta .dot { width: 3px; height: 3px; border-radius: 50%; background: var(--text-dim); }
        .vp-hero-tagline {
          font-size: 17px;
          line-height: 1.6;
          color: var(--text-dim);
          margin: 0 0 32px;
          max-width: 520px;
        }
        .vp-hero-actions { display: flex; gap: 14px; }
        .vp-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          border-radius: 4px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease;
        }
        .vp-btn:active { transform: scale(0.97); }
        .vp-btn-primary { background: var(--gold); color: #1a1310; }
        .vp-btn-primary:hover, .vp-btn-primary:focus-visible { background: #dab98c; }
        .vp-btn-secondary {
          background: rgba(245,244,242,0.07);
          color: var(--text);
          border-color: rgba(245,244,242,0.18);
          backdrop-filter: blur(6px);
        }
        .vp-btn-secondary:hover, .vp-btn-secondary:focus-visible { background: rgba(245,244,242,0.14); }

        /* ROWS */
        .vp-rows { padding: 8px 0 80px; position: relative; z-index: 2; }
        .vp-row { margin-bottom: 44px; }
        .vp-row-head {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 0 48px;
          margin-bottom: 16px;
        }
        .vp-row-eyebrow {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text);
          white-space: nowrap;
        }
        .vp-row-rule {
          height: 1px;
          flex: 1;
          background: linear-gradient(90deg, var(--gold-dim), transparent);
          opacity: 0.5;
        }
        .vp-row-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 4px 48px 12px;
          scroll-snap-type: x proximity;
          scrollbar-width: none;
        }
        .vp-row-scroll::-webkit-scrollbar { display: none; }

        .vp-card {
          flex: 0 0 auto;
          width: 230px;
          scroll-snap-align: start;
        }
        .vp-poster {
          position: relative;
          aspect-ratio: 2 / 3;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid var(--line);
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          transition: transform 0.28s cubic-bezier(.2,.7,.3,1), box-shadow 0.28s ease, border-color 0.28s ease;
        }
        .vp-poster:hover, .vp-poster:focus-visible {
          transform: translateY(-6px) scale(1.035);
          box-shadow: 0 22px 40px -14px rgba(0,0,0,0.6), 0 0 0 1px var(--gold-dim);
          z-index: 3;
        }
        .vp-poster:hover .vp-poster-play { opacity: 1; transform: scale(1); }

        .vp-variant-0 { background: linear-gradient(160deg, #1b1b1f 0%, #3a2a1f 60%, #6b4a2a 100%); }
        .vp-variant-1 { background: linear-gradient(160deg, #14151a 0%, #241b28 55%, #4a2438 100%); }
        .vp-variant-2 { background: linear-gradient(160deg, #101215 0%, #1c2630 55%, #2e4256 100%); }
        .vp-variant-3 { background: linear-gradient(160deg, #16151a 0%, #2a2020 55%, #4a2a24 100%); }
        .vp-variant-4 { background: linear-gradient(160deg, #121316 0%, #1e241f 55%, #33402f 100%); }
        .vp-variant-5 { background: linear-gradient(160deg, #17151c 0%, #2b2030 55%, #4a3560 100%); }

        .vp-poster-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .vp-poster-eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(245,244,242,0.65);
        }
        .vp-badge {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3px 7px;
          border-radius: 3px;
        }
        .vp-badge-new { background: var(--wine); color: #f5e9ea; }
        .vp-badge-original { background: transparent; border: 1px solid var(--gold); color: var(--gold); }

        .vp-poster-initial {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-weight: 300;
          font-size: 96px;
          line-height: 1;
          color: rgba(245,244,242,0.14);
          align-self: center;
        }

        .vp-poster-footer { position: relative; z-index: 1; }
        .vp-poster-title {
          font-family: 'Fraunces', serif;
          font-weight: 500;
          font-size: 17px;
          line-height: 1.25;
          margin-bottom: 4px;
        }
        .vp-poster-meta { font-size: 11.5px; color: rgba(245,244,242,0.6); }

        .vp-poster-play {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%) scale(0.85);
          width: 44px; height: 44px;
          border-radius: 50%;
          background: rgba(11,11,13,0.55);
          border: 1px solid rgba(245,244,242,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          color: var(--text);
          opacity: 0;
          transition: opacity 0.25s ease, transform 0.25s ease;
        }

        .vp-progress-track {
          position: absolute;
          left: 16px; right: 16px; bottom: 16px;
          height: 3px;
          background: rgba(245,244,242,0.2);
          border-radius: 2px;
          overflow: hidden;
        }
        .vp-progress-fill { height: 100%; background: var(--gold); }

        /* FOOTER */
        .vp-footer {
          padding: 40px 48px 60px;
          border-top: 1px solid var(--line);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          position: relative;
          z-index: 2;
        }
        .vp-footer-links { display: flex; gap: 24px; list-style: none; padding: 0; margin: 0; }
        .vp-footer-links a { color: var(--text-dim); text-decoration: none; font-size: 13px; }
        .vp-footer-links a:hover { color: var(--text); }
        .vp-footer-copy { color: rgba(156,154,150,0.6); font-size: 12px; }

        @media (prefers-reduced-motion: reduce) {
          .vp-hero-bg { animation: none; }
          .vp-poster, .vp-poster-play, .vp-nav { transition: none; }
        }

        @media (max-width: 720px) {
          .vp-nav, .vp-hero-content, .vp-row-head, .vp-row-scroll, .vp-footer { padding-left: 20px; padding-right: 20px; }
          .vp-nav-links { display: none; }
          .vp-hero-title { font-size: clamp(36px, 11vw, 56px); }
          .vp-hero-actions { flex-direction: column; align-items: stretch; }
          .vp-card { width: 160px; }
          .vp-poster-initial { font-size: 64px; }
        }
      `}</style>

      <div className="vp-grain" />

      <nav className={`vp-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="vp-logo">VEL<span>VET</span></div>
        <ul className="vp-nav-links">
          {NAV_LINKS.map((l) => (
            <li key={l}><a href="#">{l}</a></li>
          ))}
        </ul>
        <div className="vp-nav-right">
          <button className="vp-icon-btn" aria-label="Search">⌕</button>
          <button className="vp-icon-btn" aria-label="Notifications">◔</button>
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
            A navigator wakes with no memory of the voyage and a ship that insists
            it never left port. Every horizon hides a choice.
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
        <Row eyebrow="Because You Watched Meridian" items={BECAUSE_YOU_WATCHED} />
      </main>

      <footer className="vp-footer">
        <ul className="vp-footer-links">
          <li><a href="#">About</a></li>
          <li><a href="#">Help Center</a></li>
          <li><a href="#">Terms</a></li>
          <li><a href="#">Privacy</a></li>
        </ul>
        <span className="vp-footer-copy">© 2026 Velvet Streaming</span>
      </footer>
    </div>
  );
}