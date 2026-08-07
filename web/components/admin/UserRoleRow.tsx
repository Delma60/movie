"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { updateUserRole } from "@/lib/actions/admin-users";
import type { UserRole } from "@/lib/roles";

const ROLES: UserRole[] = ["user", "editor", "admin"];

interface UserRoleRowProps {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function UserRoleRow({ id, displayName, email, role, createdAt }: UserRoleRowProps) {
  const [currentRole, setCurrentRole] = useState(role);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initial = displayName.trim()[0]?.toUpperCase() ?? "?";

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as UserRole;
    setError(null);
    startTransition(async () => {
      try {
        await updateUserRole(id, next);
        setCurrentRole(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't update role.");
      }
    });
  }

  return (
    <tr className={isPending ? "admin-row-pending" : undefined}>
      <td>
        <div className="admin-user-cell">
          <span className="admin-user-cell-avatar" aria-hidden="true">
            {initial}
          </span>
          <span className="admin-table-primary">{displayName}</span>
        </div>
      </td>
      <td className="admin-table-dim">{email}</td>
      <td>
        <div className="admin-role-select-wrap">
          <select
            value={currentRole}
            onChange={handleChange}
            disabled={isPending}
            className={`admin-role-select admin-role-select-${currentRole}`}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {error && <span className="admin-status-error">{error}</span>}
        </div>
      </td>
      <td className="admin-table-dim">{formatDate(createdAt)}</td>
    </tr>
  );
}