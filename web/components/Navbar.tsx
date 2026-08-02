"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/session";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Browse", href: "/browse" },
  { label: "Movies", href: "/browse?type=movie" },
  { label: "Series", href: "/browse?type=series" },
  { label: "My List", href: "/my-list" },
];

interface NavbarProps {
  user: SessionUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const label = user?.name?.trim() || user?.email?.trim() || "";
  const initial = label ? label[0].toUpperCase() : "?";

  return (
    <nav className={`vp-nav ${scrolled ? "scrolled" : ""}`}>
      <Link href="/" className="vp-logo" aria-label="Velvet home">
        VEL<span>VET</span>
      </Link>
      <ul className="vp-nav-links">
        {NAV_LINKS.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname === link.href || pathname.startsWith(`${link.href}?`);

          return (
            <li key={link.label}>
              <Link
                href={link.href}
                className={isActive ? "active" : undefined}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="vp-nav-right">
        <Link href="/search" className="vp-icon-btn" aria-label="Search">
          ⌕
        </Link>

        {user ? (
          <>
            <button className="vp-icon-btn" aria-label="Notifications">
              ◔
            </button>
            <Link
              href="/account"
              className="vp-avatar"
              aria-label={`Account: ${label || "signed in"}`}
              title={label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1a1310",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              {initial}
            </Link>
            <a
              href="/auth/logout"
              className="vp-icon-btn"
              aria-label="Sign out"
            >
              ⎋
            </a>
          </>
        ) : (
          <Link
            href={`/login?returnTo=${encodeURIComponent(pathname || "/")}`}
            className="vp-btn vp-btn-secondary"
            style={{ padding: "8px 16px", fontSize: 13 }}
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
