"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  CreditCard,
  Film,
  LayoutDashboard,
  Megaphone,
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

interface NavChild {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  minRole?: UserRole;
  children?: NavChild[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  {
    label: "Titles",
    href: "/admin/titles",
    icon: Film,
    children: [
      { label: "All Titles", href: "/admin/titles" },
      { label: "Add Title", href: "/admin/titles/new" },
    ],
  },
  {
    label: "Episodes",
    href: "/admin/episodes",
    icon: MonitorPlay,
    children: [
      { label: "All Episodes", href: "/admin/episodes" },
      { label: "Add Episode", href: "/admin/episodes/new" },
    ],
  },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard, minRole: "admin" },
  { label: "Ads", href: "/admin/ads", icon: Megaphone, minRole: "admin" },
  { label: "Users", href: "/admin/users", icon: UsersRound, minRole: "admin" },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    minRole: "admin",
  },
];

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({ role, name, email }: AdminSidebarProps) {
  const pathname = usePathname();
  const label = name?.trim() || email?.trim() || "";
  const initial = label ? label[0].toUpperCase() : "?";

  const items = NAV_ITEMS.filter(
    (item) => !item.minRole || hasRole(role, item.minRole),
  );

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    return new Set(
      items
        .filter((item) => item.children && isActivePath(pathname, item.href))
        .map((item) => item.href),
    );
  });

  function toggle(href: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  }

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
            const active = isActivePath(pathname, item.href);
            const hasChildren = !!item.children?.length;
            const isOpen = hasChildren && expanded.has(item.href);

            if (!hasChildren) {
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
            }

            return (
              <div key={item.href} className="admin-nav-group">
                <button
                  type="button"
                  className={`admin-nav-link admin-nav-group-toggle${active ? " active" : ""}`}
                  aria-expanded={isOpen}
                  onClick={() => toggle(item.href)}
                >
                  <item.icon
                    className="admin-nav-icon"
                    aria-hidden="true"
                    size={18}
                  />
                  <span className="admin-nav-label">{item.label}</span>
                  <ChevronDown
                    className={`admin-nav-chevron${isOpen ? " open" : ""}`}
                    size={14}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && (
                  <div className="admin-nav-sub">
                    {item.children!.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`admin-nav-sublink${childActive ? " active" : ""}`}
                          aria-current={childActive ? "page" : undefined}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
