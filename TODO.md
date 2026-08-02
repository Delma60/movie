# Velvet — Project Todo

Scope: public web app, admin panel, shared backend, then WebView/APK wrap.
Order matters — sections are roughly sequential, but Auth (3) should land before
Admin (5) since admin depends on roles.

---

## Admin readiness assessment (current state)

### Blocking — these should land first because Admin depends on them

- [x] Protect `/admin` end to end. `proxy.ts` now gates `/admin/*` (redirects
      unauthenticated users to `/login`, redirects authenticated-but-not-`editor`+
      users home), and `app/admin/layout.tsx` re-checks server-side as
      defense in depth.
- [x] Implement real role enforcement. Role is now embedded in the session
      JWT at login (password + Spurs), the first admin is created via the
      `ADMIN_BOOTSTRAP_EMAILS` env var, and `/admin/users` lets an admin
      promote/demote other accounts (see lib/actions/admin-users.ts).

### Not blocking, but incomplete from earlier sections — worth closing out first since they are small and will otherwise force context switching

- [ ] Replace the homepage mock data with real data from `titles`, `watchProgress`, and `myList` instead of hardcoded arrays.
- [ ] Add watch progress persistence: write progress from the player and read it back for Continue Watching.
- [ ] Add "My List" add support; the current UI only supports remove.
- [ ] Build `/account` into a real account page with profile fields and subscription info.

### Smaller / lower priority, can defer into or alongside Admin work

- [ ] Add poster/backdrop upload/storage wiring and a corresponding admin upload flow.
- [ ] Add a `.env.example` for the web app with the expected DB, storage, auth, and provider environment variables — now also needs `AUTH_SESSION_SECRET` and `ADMIN_BOOTSTRAP_EMAILS` documented (both already required by code, just not written down anywhere).
- [ ] Decide the route-group structure for public vs. admin routes.

### Suggested order

1. Decide the route-group structure.
2. ~~Add role enforcement to the proxy and a way to grant `admin`/`editor` roles.~~ Done.
3. Start building the Admin shell and access control. (Shell/access control done; content management itself is still section 7.)
4. Then close out the public app gaps (homepage wiring, watch progress, My List add, account page).

---

## 1. Foundation

- [x] Extract inline styles from `page.tsx` into `globals.css`
- [x] Move Fraunces/Manrope to `next/font/google`
- [x] Add `viewport-fit=cover` to viewport meta (needed for safe-area insets later)
- [ ] Decide project structure: `app/(public)/...` for the site, `app/(admin)/admin/...` for the admin panel, sharing one Next.js app vs. splitting into two apps/repos
- [ ] Set up environment config (`.env.local`, `.env.example`) for API keys, DB URL, storage bucket, etc.
- [ ] Pick DB/backend: Postgres via Supabase/Neon/PlanetScale, or a headless CMS (Sanity/Strapi) if non-devs will manage content
- [ ] Pick media storage/CDN for posters and video files (S3/Cloudflare R2/Mux/Bunny)

## 2. Data model

- [x] `Title` (movie or series): id, slug, title, synopsis, genre[], year, duration, rating, poster_url, backdrop_url, trailer_url, status (draft/published), created_at
- [x] `Episode` (for series): id, title_id, season, episode_number, video_url, duration
- [x] `VideoAsset`: id, title_id/episode_id, source_url, resolution variants, encoding status
- [x] `User`: id, email, password_hash/oauth, display_name, role (`user` / `admin` / `editor`), created_at
- [x] `WatchProgress`: user_id, title_id/episode_id, seconds_watched, updated_at
- [x] `MyList`: user_id, title_id
- [x] `Subscription` (if paid): user_id, plan, status, renews_at
- [x] Seed script with sample titles so both public site and admin have data to work against

## 3. Auth & roles

- [x] User-facing auth: sign up / log in (email+password, plus Spurs OAuth)
- [x] Session handling (JWT cookie, now carrying role). Password reset and email verification are still not implemented — no email-sending infra in the project yet, deliberately left out of this pass.
- [x] Role field (`user`, `editor`, `admin`) on the user record — now actually enforced, not just present in the schema.
- [x] Route protection: `proxy.ts` middleware blocks `/admin/*` for anyone without `editor`/`admin` role.
- [x] Separate admin login screen (or same login, redirect by role) — decided: same login/signup screens for everyone, no role-based auto-redirect after login. `/admin` is reached by typing/linking the URL and is gated by role, not by a separate login flow.
- [ ] Audit log table: who changed what content, when (useful once more than one admin exists). Role changes currently aren't logged anywhere beyond the DB row itself — worth adding before this ships to more than a couple of trusted admins.

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

- [x] `/admin` route group, gated by role middleware from step 3
- [ ] Admin layout: sidebar nav (Dashboard, Titles, Episodes, Users, Analytics, Settings), distinct from public nav — currently just a bare shell + dashboard link + `/admin/users`
- [x] Admin login/redirect flow tested independently from user login — there's no separate admin login; `/admin` reuses the normal session and is gated by role
- [ ] Basic dashboard landing page: counts (titles, users, active subscriptions), recent activity

## 7. Admin panel — content management (core)

- [ ] Titles list: table view, search/filter, status (draft/published) toggle
- [ ] Create/edit title form: metadata fields, poster upload, backdrop upload, trailer URL
- [ ] Episode management for series: add/reorder/edit episodes under a title
- [ ] Video upload/attach flow: upload to storage, trigger transcoding if using Mux/Bunny, show processing status
- [ ] Delete/archive title with confirmation (soft delete preferred over hard delete)
- [ ] Bulk actions (publish/unpublish multiple titles) — nice-to-have, not v1

## 8. Admin panel — user management

- [x] Users list: `/admin/users`, admin-only
- [x] User detail: role changes via a dropdown per row (lib/actions/admin-users.ts). No watch-history view, ban/disable, or search/filter yet.
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
