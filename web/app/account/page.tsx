import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth";
import { getSubscriptionForUser } from "@/lib/subscriptions";
import { getWatchHistory } from "@/lib/watch-history";
import { getMyListTitles } from "@/lib/my-list";
import { PosterCard } from "@/components/PosterCard";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { changePassword, signOutEverywhere, updateProfile } from "@/lib/actions/account";
import { formatDuration } from "@/lib/titles";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Past Due",
  canceled: "Canceled",
};

const ERRORS: Record<string, string> = {
  invalid_profile: "Enter a name and email address.",
  email_taken: "Another account already uses that email.",
  wrong_password: "Your current password isn't right.",
  invalid_password: "New password must be at least 8 characters and match the confirmation.",
};

const SUCCESSES: Record<string, string> = {
  profile_updated: "Profile updated.",
  password_updated: "Password updated.",
  signed_out_everywhere: "Signed out on all other devices.",
};

const TOC = [
  { id: "profile", label: "Profile" },
  { id: "password", label: "Password" },
  { id: "subscription", label: "Subscription" },
  { id: "history", label: "Continue Watching" },
  { id: "mylist", label: "My List" },
  { id: "danger", label: "Danger Zone" },
];

function formatDate(
  d: Date | string | null,
  opts?: Intl.DateTimeFormatOptions
): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", opts ?? { month: "long", day: "numeric", year: "numeric" });
}

function memberSerial(id: string): string {
  const clean = id.replace(/-/g, "").toUpperCase();
  return `VLV-${clean.slice(0, 4)}-${clean.slice(4, 8)}`;
}

interface AccountPageProps {
  searchParams: Promise<{ error?: string; success?: string }>;
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login?returnTo=/account");

  const { error, success } = await searchParams;
  const errorMessage = error ? ERRORS[error] ?? "Something went wrong." : null;
  const successMessage = success ? SUCCESSES[success] ?? null : null;

  const [subscription, watchHistory, myList] = await Promise.all([
    getSubscriptionForUser(user.id),
    getWatchHistory(user.id),
    getMyListTitles(user.id),
  ]);

  return (
    <main className="vp-root vp-account-page">
      <div className="vp-account-shell">
        <aside className="vp-account-rail">
          <div className="vp-membercard">
            <div className="vp-membercard-main">
              <span className="vp-membercard-eyebrow">Velvet Membership</span>
              <h1 className="vp-membercard-name">{user.displayName}</h1>
              <p className="vp-membercard-email">{user.email}</p>
              {user.role !== "user" && (
                <span className="vp-membercard-tier">
                  {user.role === "admin" ? "Admin" : "Editor"}
                </span>
              )}
              <div className="vp-membercard-since">
                <span>Member since</span>
                <strong>{formatDate(user.createdAt, { month: "short", year: "numeric" })}</strong>
              </div>
            </div>
            <div className="vp-membercard-stub" aria-hidden="true">
              <span className="vp-membercard-serial">{memberSerial(user.id)}</span>
            </div>
          </div>

          <nav className="vp-account-toc" aria-label="Account sections">
            {TOC.map((item, i) => (
              <a key={item.id} href={`#${item.id}`} className="vp-account-toc-link">
                <span className="vp-account-toc-index">{String(i + 1).padStart(2, "0")}</span>
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="vp-account-main">
          {errorMessage && <div className="vp-login-error vp-account-banner">{errorMessage}</div>}
          {successMessage && (
            <div className="vp-login-error vp-account-banner vp-account-banner-success">
              {successMessage}
            </div>
          )}

          <section className="vp-account-section" id="profile">
            <div className="vp-row-head">
              <span className="vp-row-eyebrow">01 — Profile</span>
              <span className="vp-row-rule" />
            </div>
            <form action={updateProfile} className="vp-login-form vp-account-form">
              <label className="vp-field">
                <span>Name</span>
                <input type="text" name="displayName" defaultValue={user.displayName} required />
              </label>
              <label className="vp-field">
                <span>Email</span>
                <input type="email" name="email" defaultValue={user.email} required />
              </label>
              <button type="submit" className="vp-btn vp-btn-primary vp-account-form-submit">
                Save Changes
              </button>
            </form>
          </section>

          <section className="vp-account-section" id="password">
            <div className="vp-row-head">
              <span className="vp-row-eyebrow">02 — Password</span>
              <span className="vp-row-rule" />
            </div>
            <form action={changePassword} className="vp-login-form vp-account-form">
              <label className="vp-field">
                <span>Current Password</span>
                <input type="password" name="currentPassword" autoComplete="current-password" />
              </label>
              <label className="vp-field">
                <span>New Password</span>
                <input type="password" name="newPassword" autoComplete="new-password" minLength={8} required />
              </label>
              <label className="vp-field">
                <span>Confirm New Password</span>
                <input type="password" name="confirmPassword" autoComplete="new-password" minLength={8} required />
              </label>
              <p className="vp-account-hint">
                Signed up with Spurs and never set a password? Leave “Current Password” blank to set one now.
              </p>
              <button type="submit" className="vp-btn vp-btn-primary vp-account-form-submit">
                Update Password
              </button>
            </form>
          </section>

          <section className="vp-account-section" id="subscription">
            <div className="vp-row-head">
              <span className="vp-row-eyebrow">03 — Subscription</span>
              <span className="vp-row-rule" />
            </div>

            {subscription ? (
              <div className="vp-account-sub-card">
                <div className="vp-account-sub-row">
                  <span className="vp-account-sub-label">Plan</span>
                  <span className="vp-account-sub-value">{subscription.plan}</span>
                </div>
                <div className="vp-account-sub-row">
                  <span className="vp-account-sub-label">Status</span>
                  <span className={`vp-status-pill vp-status-${subscription.status}`}>
                    {STATUS_LABEL[subscription.status] ?? subscription.status}
                  </span>
                </div>
                {subscription.currentPeriodEnd && (
                  <div className="vp-account-sub-row">
                    <span className="vp-account-sub-label">
                      {subscription.status === "canceled" ? "Access until" : "Renews"}
                    </span>
                    <span className="vp-account-sub-value">
                      {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="vp-account-sub-card vp-account-sub-empty">
                <p>You don&apos;t have an active subscription yet.</p>
                <button type="button" className="vp-btn vp-btn-primary" disabled>
                  Choose a Plan
                </button>
              </div>
            )}
          </section>

          <section className="vp-account-section" id="history">
            <div className="vp-row-head">
              <span className="vp-row-eyebrow">04 — Continue Watching</span>
              <span className="vp-row-rule" />
            </div>
            {watchHistory.length === 0 ? (
              <p className="vp-account-empty-text">Nothing watched yet.</p>
            ) : (
              <div className="vp-account-grid">
                {watchHistory.map((t, i) => (
                  <PosterCard
                    key={t.id}
                    variant={i}
                    href={`/title/${t.slug}`}
                    title={t.title}
                    genre={t.genre}
                    meta={
                      t.type === "series"
                        ? "Series"
                        : [formatDuration(t.durationMinutes), t.year].filter(Boolean).join(" · ")
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section className="vp-account-section" id="mylist">
            <div className="vp-row-head">
              <span className="vp-row-eyebrow">05 — My List</span>
              <span className="vp-row-rule" />
            </div>
            {myList.length === 0 ? (
              <p className="vp-account-empty-text">Your list is empty.</p>
            ) : (
              <>
                <div className="vp-account-grid">
                  {myList.slice(0, 6).map((t, i) => (
                    <PosterCard
                      key={t.id}
                      variant={i}
                      href={`/title/${t.slug}`}
                      title={t.title}
                      genre={t.genre}
                      meta={
                        t.type === "series"
                          ? "Series"
                          : [formatDuration(t.durationMinutes), t.year].filter(Boolean).join(" · ")
                      }
                      badge={t.isOriginal ? "Original" : undefined}
                    />
                  ))}
                </div>
                {myList.length > 6 && (
                  <Link href="/my-list" className="vp-account-view-all">
                    View all {myList.length} →
                  </Link>
                )}
              </>
            )}
          </section>

          <section className="vp-account-section vp-account-danger" id="danger">
            <div className="vp-row-head">
              <span className="vp-row-eyebrow">06 — Danger Zone</span>
              <span className="vp-row-rule" />
            </div>
            <div className="vp-account-danger-row">
              <div>
                <p className="vp-account-danger-title">Sign out everywhere</p>
                <p className="vp-account-danger-text">
                  Ends every other signed-in session on all devices. This device stays signed in.
                </p>
              </div>
              <form action={signOutEverywhere}>
                <button type="submit" className="vp-btn vp-btn-secondary">
                  Sign Out Everywhere
                </button>
              </form>
            </div>
            <div className="vp-account-danger-row">
              <div>
                <p className="vp-account-danger-title">Delete account</p>
                <p className="vp-account-danger-text">
                  Permanently removes your profile, watch history, My List, and subscription record.
                </p>
              </div>
              <DeleteAccountButton />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
