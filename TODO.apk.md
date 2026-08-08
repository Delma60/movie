# Velvet Mobile — Todo

Scope: the standalone Android app (and whatever else it grows into — iOS,
etc.). This app is **not** a WebView wrapper around `web/` — it's a native
client that talks to Velvet's backend. Anything specific to `web/`'s own
pages, admin panel, or server-rendering lives in `TODO.md`, not here.

This file assumes the mobile app has (or will have) its own repo/codebase.
Items here are written from the backend's point of view: what `web/` needs
to expose or change to support a real native client, plus the mobile-side
decisions that depend on it.

---

## 0. Foundational decision — API surface

Right now `web/` fetches data inside Next.js Server Components
(`lib/titles.ts`, `lib/admin-dashboard.ts`, etc.) — there is no general
-purpose API a separate native client can call. This blocks almost
everything else in this file.

- [ ] Decide the shape of the API layer: REST route handlers under
      `app/api/**`, or a typed RPC layer (tRPC, etc.)
- [ ] Decide what's exposed: catalog browsing/search, title/episode detail,
      watch progress read/write, My List read/write, account/profile,
      subscription status — versus what stays admin-only and server-only
- [ ] Version the API surface (`/api/v1/...`) from day one so the backend
      can evolve without breaking a shipped app binary
- [ ] Decide response format for errors (consistent shape, not ad hoc
      `redirect()`/thrown-`Error()` patterns that assume a browser)

## 1. Auth for a native client

`web/lib/session.ts` issues an HttpOnly cookie (`SESSION_COOKIE`) via
`jose`/JWT — that's fine for a browser but doesn't fit a native app.

- [ ] Decide the mobile auth flow: token in secure storage (Keychain /
      Android Keystore) with a bearer `Authorization` header, vs. some
      cookie-jar trick — bearer token is the standard choice for native
- [ ] Add a token-issuing endpoint (email+password) that returns a JWT/
      refresh-token pair instead of setting a cookie
- [ ] Figure out the Spurs OAuth flow on mobile — `web/lib/spurs.ts` uses
      an authorization-code+PKCE flow built around a web redirect
      (`/auth/callback`); mobile needs either an in-app browser tab
      redirecting to a custom scheme, or a native Spurs SDK if one exists
- [ ] Decide token refresh/expiry strategy so the app doesn't force a
      re-login every 30 days like the web session does

## 2. Backend changes needed to support the app

- [ ] CORS: `web/`'s route handlers currently assume same-origin browser
      requests; confirm what's needed once requests come from a native
      app's own origin (or lack thereof) instead
- [ ] Confirm `proxy.ts`'s role-gating (`/admin/*`) is irrelevant to the
      app's traffic patterns — admin isn't meant to be reachable from
      mobile, native or otherwise (see Section 4)
- [ ] Rate limiting / abuse protection on any new public API routes, since
      they're no longer implicitly gated by being embedded in server-
      rendered pages

## 3. App-side features (tracked here only as "what the app needs from
the backend," not as native UI work)

- [ ] Catalog browse/search — matches `web/lib/titles.ts`
      (`getBrowseTitles`, `searchTitles`) functionality
- [ ] Title/episode detail + related titles
- [ ] Video playback — native player (ExoPlayer/AVPlayer) hitting
      `video_assets.source_url` directly; confirm URLs are directly
      streamable outside a `<video>` tag context (signed URLs, CORS, HLS
      manifest format, etc.)
- [ ] Continue Watching — read/write `watch_progress` from the native
      player's playback position
- [ ] My List — read/write `my_list`, same as `web/lib/my-list.ts`
- [ ] Account/profile + subscription status (read-only is enough for v1;
      no billing flow implied)
- [ ] Push notifications — new territory, not covered by `web/` at all

## 4. Explicitly out of scope for the app (decided)

- [x] Admin panel is **not** part of the mobile app. `/admin` stays a
      web-only, role-gated surface. No native admin screens planned.
- [x] No WebView fallback anywhere in the app — if a native screen isn't
      built yet, the feature isn't in the app yet, rather than falling
      back to loading `web/` in a WebView.

## 5. Deep linking

- [ ] Define a universal link / app link scheme (`https://velvet.app/...`
      resolving into the app when installed) rather than a custom
      `velvet://` scheme, so notification/share links degrade gracefully
      to the website when the app isn't installed
- [ ] Map link targets to app screens: title detail, watch, my-list

## 6. Release / distribution

- [ ] App signing, Play Store listing, versioning strategy
- [ ] Crash reporting / basic analytics (separate from `web/`'s
      Sentry-if-added plan in `TODO.md` §12)
- [ ] Decide minimum supported OS version