import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "Velvet Admin",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // proxy.ts already gates /admin/* at the edge, but every server-rendered
  // entry point re-checks so this layout stays safe even if the middleware
  // matcher is ever changed, misconfigured, or bypassed.
  const session = await requireRole("editor", "/admin");

  return (
    <div className="admin-shell">
      <AdminSidebar
        role={session.role}
        name={session.name}
        email={session.email}
      />
      <div className="admin-content">{children}</div>
    </div>
  );
}
