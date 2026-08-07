"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { updateSubscriptionStatus } from "@/lib/actions/admin-subscriptions";
import type { SubscriptionStatus } from "@/lib/db/schema";

const STATUSES: SubscriptionStatus[] = [
  "active",
  "past_due",
  "canceled",
  "trialing",
];

interface SubscriptionStatusToggleProps {
  id: string;
  status: SubscriptionStatus;
}

export function SubscriptionStatusToggle({ id, status }: SubscriptionStatusToggleProps) {
  const [current, setCurrent] = useState<SubscriptionStatus>(status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as SubscriptionStatus;
    setError(null);

    startTransition(async () => {
      try {
        await updateSubscriptionStatus(id, next);
        setCurrent(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't update status.");
      }
    });
  }

  return (
    <div className="admin-status-toggle-wrap">
      <select
        value={current}
        onChange={handleChange}
        disabled={isPending}
        className="admin-status-select"
      >
        {STATUSES.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      {error && <span className="admin-status-error">{error}</span>}
    </div>
  );
}
