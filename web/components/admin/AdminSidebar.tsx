"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Film,
  LayoutDashboard,
  MonitorPlay,
  Settings,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { hasRole, type UserRole } from "@/lib/roles";

interface AdminSidebarProps {
  role: UserRole;
  name?: string;
  email?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  minRole?: UserRole;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Titles", href: "/admin/titles", icon: Film },
  { label: "Episodes", href: "/admin/episodes", icon: MonitorPlay },
  { label: "Users", href: "/admin/users", icon: UsersRound, minRole: "admin" },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({ role, name, email }: AdminSidebarProps) {
  const pathname = usePathname();
  const label = name?.trim() || email?.trim() || "";
  const initial = label ? label[0].toUpperCase() : "?";

  const items = NAV_ITEMS.filter(
    (item) => !item.minRole || hasRole(role, item.minRole),
  );

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-top">
        <Link
          href="/admin/dashboard"
          className="admin-logo"
          aria-label="Velvet admin home"
        >
          VEL<span>VET</span>
          <span className="admin-logo-tag">Admin</span>
        </Link>

        <nav className="admin-nav" aria-label="Admin navigation">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link${active ? " active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <item.icon
                  className="admin-nav-icon"
                  aria-hidden="true"
                  size={18}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="admin-sidebar-bottom">
        <Link href="/" className="admin-nav-link admin-nav-exit">
          <ArrowLeft className="admin-nav-icon" aria-hidden="true" size={18} />
          Back to site
        </Link>
        <div className="admin-user">
          <div className="admin-user-avatar" aria-hidden="true">
            {initial}
          </div>
          <div className="admin-user-info">
            <span className="admin-user-name">{label || "Signed in"}</span>
            <span className="admin-user-role">{role}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
