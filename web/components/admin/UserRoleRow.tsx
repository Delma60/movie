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
}

export function UserRoleRow({ id, displayName, email, role }: UserRoleRowProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as UserRole;
    setError(null);
    startTransition(async () => {
      try {
        await updateUserRole(id, next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't update role.");
      }
    });
  }

  return (
    <tr style={{ opacity: isPending ? 0.6 : 1 }}>
      <td>{displayName}</td>
      <td>{email}</td>
      <td>
        <select defaultValue={role} onChange={handleChange} disabled={isPending}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {error && (
          <div style={{ color: "#e08a8a", fontSize: 12, marginTop: 4 }}>{error}</div>
        )}
      </td>
    </tr>
  );
}