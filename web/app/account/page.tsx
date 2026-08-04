import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/auth";
import { getSubscriptionForUser } from "@/lib/subscriptions";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Past Due",
  canceled: "Canceled",
};

function formatDate(d: Date | string | null): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AccountPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login?returnTo=/account");

  const subscription = await getSubscriptionForUser(user.id);
  const initial = (user.displayName || user.email)[0]?.toUpperCase() ?? "?";

  return (
    <main className="vp-root vp-browse vp-account-page">
      <div className="vp-browse-header">
        <h1 className="vp-browse-title">Account</h1>
        <p className="vp-browse-subtitle">Manage your profile and subscription.</p>
      </div>

      <section className="vp-account-card">
        <div className="vp-account-avatar" aria-hidden="true">
          {initial}
        </div>
        <div className="vp-account-identity">
          <h2 className="vp-account-name">{user.displayName}</h2>
          <p className="vp-account-email">{user.email}</p>
          {user.role !== "user" && (
            <span className="vp-badge vp-badge-original">
              {user.role === "admin" ? "Admin" : "Editor"}
            </span>
          )}
        </div>
      </section>

      <section className="vp-account-section">
        <div className="vp-row-head">
          <span className="vp-row-eyebrow">Subscription</span>
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

      <section className="vp-account-section">
        <div className="vp-row-head">
          <span className="vp-row-eyebrow">Session</span>
          <span className="vp-row-rule" />
        </div>
        <div className="vp-account-actions">
          <a href="/auth/logout" className="vp-btn vp-btn-secondary">
            Sign Out
          </a>
        </div>
      </section>
    </main>
  );
}
