import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getAdminSubscriptions, getAdminSubscriptionCounts } from "@/lib/admin-subscriptions";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTable } from "@/components/admin/AdminTable";
import { SubscriptionStatusToggle } from "@/components/admin/SubscriptionStatusToggle";
import { getAdminPaginationMeta } from "@/lib/admin-query";
import type { SubscriptionStatus } from "@/lib/db/schema";

interface AdminSubscriptionsPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    created?: string;
    page?: string;
  }>;
}

const VALID_STATUS: SubscriptionStatus[] = [
  "active",
  "past_due",
  "canceled",
  "trialing",
];

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: AdminSubscriptionsPageProps) {
  await requireRole("admin", "/admin");

  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const status = VALID_STATUS.includes(params.status as SubscriptionStatus)
    ? (params.status as SubscriptionStatus)
    : undefined;
  const page = Number.parseInt(params.page ?? "1", 10);
  const created = params.created === "1";

  const [result, counts] = await Promise.all([
    getAdminSubscriptions({ q, status, page }),
    getAdminSubscriptionCounts(),
  ]);
  const pagination = getAdminPaginationMeta(page, 20, result.total);

  return (
    <main className="admin-page admin-subscriptions-page">
      <div className="admin-page-head">
        <div>
          <h1>Subscriptions</h1>
          <p>
            {counts.total} total · {counts.active} active · {counts.trialing}{" "}
            trialing · {counts.past_due} past due · {counts.canceled} canceled
          </p>
        </div>
        <Link href="/admin/subscriptions/new" className="admin-btn admin-btn-primary">
          Add Subscription
        </Link>
      </div>

      {created && <div className="admin-form-success">Subscription created.</div>}

      <AdminFilterBar
        basePath="/admin/subscriptions"
        resultCount={result.total}
        searchPlaceholder="Search user or plan…"
        filters={[
          {
            key: "status",
            label: "All statuses",
            value: status ?? "",
            options: [
              { value: "", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "past_due", label: "Past due" },
              { value: "canceled", label: "Canceled" },
              { value: "trialing", label: "Trialing" },
            ],
          },
        ]}
        singularLabel="subscription"
        pluralLabel="subscriptions"
      />

      <AdminTable
        columns={["User", "Email", "Plan", "Status", "Period End", "Added", ""]}
        rows={result.rows.map((subscription) => (
          <tr key={subscription.id}>
            <td>
              <span className="admin-table-primary">{subscription.displayName}</span>
            </td>
            <td className="admin-table-dim">{subscription.email}</td>
            <td>{subscription.plan}</td>
            <td>
              <SubscriptionStatusToggle
                id={subscription.id}
                status={subscription.status}
              />
            </td>
            <td className="admin-table-dim">
              {subscription.currentPeriodEnd
                ? formatDate(subscription.currentPeriodEnd)
                : "—"}
            </td>
            <td className="admin-table-dim">{formatDate(subscription.createdAt)}</td>
            <td></td>
          </tr>
        ))}
        emptyMessage="No subscriptions match those filters."
      />

      <AdminPagination
        basePath="/admin/subscriptions"
        meta={pagination}
        searchParams={new URLSearchParams(params as Record<string, string>)}
      />
    </main>
  );
}
