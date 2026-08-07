import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createSubscription } from "@/lib/actions/admin-subscriptions";

const ERRORS: Record<string, string> = {
  missing_fields: "Email and plan are required.",
  invalid_status: "Choose a valid status.",
  invalid_email: "Enter a valid email address.",
  unknown_user: "No user exists with that email.",
  invalid_date: "Enter a valid date for the period end.",
};

interface AdminNewSubscriptionPageProps {
  searchParams: Promise<{ error?: string; email?: string }>;
}

export default async function AdminNewSubscriptionPage({
  searchParams,
}: AdminNewSubscriptionPageProps) {
  await requireRole("admin", "/admin");

  const { error, email } = await searchParams;
  const message = error ? ERRORS[error] ?? "Couldn't create the subscription." : null;

  return (
    <main className="admin-page admin-form-page">
      <div className="admin-page-head">
        <div>
          <Link href="/admin/subscriptions" className="admin-back-link">
            <ArrowLeft size={14} strokeWidth={2.25} />
            Subscriptions
          </Link>
          <h1>Add Subscription</h1>
          <p>Create a subscription record for an existing user.</p>
        </div>
      </div>

      {message && <div className="admin-form-error">{message}</div>}

      <form action={createSubscription} className="admin-form admin-panel">
        <div className="admin-field">
          <label htmlFor="email">User email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={email ?? ""}
            autoFocus
          />
        </div>

        <div className="admin-field">
          <label htmlFor="plan">Plan</label>
          <input id="plan" name="plan" type="text" required />
        </div>

        <div className="admin-field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue="active">
            <option value="active">Active</option>
            <option value="past_due">Past due</option>
            <option value="canceled">Canceled</option>
            <option value="trialing">Trialing</option>
          </select>
        </div>

        <div className="admin-field">
          <label htmlFor="currentPeriodEnd">Current period end</label>
          <input id="currentPeriodEnd" name="currentPeriodEnd" type="date" />
        </div>

        <div className="admin-form-actions">
          <Link href="/admin/subscriptions" className="admin-btn admin-btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="admin-btn admin-btn-primary">
            Create Subscription
          </button>
        </div>
      </form>
    </main>
  );
}
