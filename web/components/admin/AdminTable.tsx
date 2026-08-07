import Link from "next/link";
import type { ReactNode } from "react";

interface AdminTableProps {
  columns: string[];
  rows: ReactNode[];
  emptyMessage?: string;
  emptyState?: ReactNode;
}

export function AdminTable({
  columns,
  rows,
  emptyMessage,
  emptyState,
}: AdminTableProps) {
  if (rows.length === 0) {
    if (emptyState) return <>{emptyState}</>;

    return (
      <div className="admin-panel admin-empty-block">
        <p className="admin-empty">{emptyMessage ?? "No records found."}</p>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>{row}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface AdminTableCellLinkProps {
  href: string;
  children: ReactNode;
  external?: boolean;
}

export function AdminTableCellLink({
  href,
  children,
  external = false,
}: AdminTableCellLinkProps) {
  return (
    <Link
      href={href}
      className="admin-table-link"
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      {children}
    </Link>
  );
}
