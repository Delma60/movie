# Velvet — Project Todo

Scope: public web app, admin panel, shared backend, then WebView/APK wrap.
Order matters — sections are roughly sequential, but Auth (3) should land before
Admin (5) since admin depends on roles.

---

## 1. Foundation

- [ ] Extract inline styles from `page.tsx` into `globals.css` (done — see previous message)
- [ ] Move Fraunces/Manrope to `next/font/google`
- [ ] Add `viewport-fit=cover` to viewport meta (needed for safe-area insets later)
- [ ] Decide project structure: `app/(public)/...` for the site, `app/(admin)/admin/...` for the admin panel, sharing one Next.js app vs. splitting into two apps/repos
- [ ] Set up environment config (`.env.local`, `.env.example`) for API keys, DB URL, storage bucket, etc.
- [ ] Pick DB/backend: Postgres via Supabase/Neon/PlanetScale, or a headless CMS (Sanity/Strapi) if non-devs will manage content
- [ ] Pick media storage/CDN for posters and video files (S3/Cloudflare R2/Mux/Bunny)

## 2. Data model

- [ ] `Title` (movie or series): id, slug, title, synopsis, genre[], year, duration, rating, poster_url, backdrop_url, trailer_url, status (draft/published), created_at
- [ ] `Episode` (for series): id, title_id, season, episode_number, video_url, duration
- [ ] `VideoAsset`: id, title_id/episode_id, source_url, resolution variants, encoding status
- [ ] `User`: id, email, password_hash/oauth, display_name, role (`user` / `admin` / `editor`), created_at
- [ ] `WatchProgress`: user_id, title_id/episode_id, seconds_watched, updated_at
- [ ] `MyList`: user_id, title_id
- [ ] `Subscription` (if paid): user_id, plan, status, renews_at
- [ ] Seed script with sample titles so both public site and admin have data to work against

## 3. Auth & roles

- [ ] User-facing auth: sign up / log in (Auth.js/NextAuth, Clerk, or Supabase Auth)
- [ ] Session handling (JWT or DB session), password reset, email verification
- [ ] Role field (`user`, `editor`, `admin`) on the user record
- [ ] Route protection: middleware that blocks `/admin/*` for anyone without `editor`/`admin` role
- [ ] Separate admin login screen (or same login, redirect by role) — decide now, it affects routing structure
- [ ] Audit log table: who changed what content, when (useful once more than one admin exists)

## 4. Public web app — pages

- [ ] `/` Home (exists — hero + rows)
- [ ] `/browse` or `/movies`, `/series` — catalog with genre/year filters, sort
- [ ] `/title/[slug]` — detail page: synopsis, cast, related titles, play button
- [ ] `/watch/[slug]` — player page
- [ ] `/search` — search-as-you-type or submit
- [ ] `/my-list`
- [ ] `/login`, `/signup`, `/account` (profile, password, subscription status)
- [ ] Empty/error states: no search results, failed video load, offline (relevant once wrapped in WebView)

## 5. Public web app — features

- [ ] Video player: HTML5 `<video>`, HLS.js for adaptive streaming if using segmented video
- [ ] Continue-watching: read/write `WatchProgress`, drive the progress bar already in the UI
- [ ] "My List" add/remove, reflected instantly in UI
- [ ] Search: query titles by name/genre
- [ ] Responsive pass on every page at mobile widths (this becomes the APK's UI, so this is not optional)

## 6. Admin panel — access & shell

- [ ] `/admin` route group, gated by role middleware from step 3
- [ ] Admin layout: sidebar nav (Dashboard, Titles, Episodes, Users, Analytics, Settings), distinct from public nav
- [ ] Admin login/redirect flow tested independently from user login
- [ ] Basic dashboard landing page: counts (titles, users, active subscriptions), recent activity

## 7. Admin panel — content management (core)

- [ ] Titles list: table view, search/filter, status (draft/published) toggle
- [ ] Create/edit title form: metadata fields, poster upload, backdrop upload, trailer URL
- [ ] Episode management for series: add/reorder/edit episodes under a title
- [ ] Video upload/attach flow: upload to storage, trigger transcoding if using Mux/Bunny, show processing status
- [ ] Delete/archive title with confirmation (soft delete preferred over hard delete)
- [ ] Bulk actions (publish/unpublish multiple titles) — nice-to-have, not v1

## 8. Admin panel — user management

- [ ] Users list: search, filter by role/subscription status
- [ ] User detail: view watch history, manually adjust role, disable/ban account
- [ ] Subscription status view (if billing is in scope) — plan, renewal date, payment issues

## 9. Admin panel — analytics

- [ ] Basic metrics: most-watched titles, signups over time, active users
- [ ] Simple charts (recharts) rather than a full BI tool for v1
- [ ] Export to CSV — nice-to-have

## 10. Billing (only if the product is paid)

- [ ] Stripe (or similar) integration for subscriptions
- [ ] Webhook handling for renewal/cancellation/failed payment
- [ ] Admin visibility into billing status per user (covered in 8)
- [ ] Paywall gating on `/watch/[slug]` if plan requires it

## 11. WebView / APK readiness

- [ ] `overscroll-behavior: none`, safe-area padding (already in `globals.css`)
- [ ] All interactive elements work on tap, no hover-only affordances
- [ ] Tap targets ≥44px, `-webkit-tap-highlight-color: transparent`
- [ ] Handle Android hardware back button → router.back(), not app exit
- [ ] Deep link scheme if the APK needs to open specific titles from notifications/links
- [ ] Confirm admin panel is either excluded from the APK build (recommended — admin shouldn't ship inside a public app bundle) or gated hard behind role + a separate build flag
- [ ] Test video playback inside Android WebView specifically (autoplay restrictions, fullscreen API support differ from Chrome)
- [ ] Test on a real low-end Android device — `backdrop-filter: blur()` and the ken-burns hero animation are the most likely perf offenders
- [ ] Choose wrapper: Capacitor (if native APIs like push notifications are needed later) vs. a minimal WebView Activity pointing at the deployed URL (fastest for v1)

## 12. QA & deploy

- [ ] Lint/typecheck passing (`npm run lint`, `tsc --noEmit`)
- [ ] Manual pass through every public + admin route on mobile viewport
- [ ] Deploy web app (Vercel)
- [ ] Point WebView APK at the deployed URL, do a full smoke test on device
- [ ] Post-launch: error tracking (Sentry) and basic uptime monitoring