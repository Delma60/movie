"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Browse", href: "/browse" },
  { label: "Movies", href: "/browse?type=movie" },
  { label: "Series", href: "/browse?type=series" },
  { label: "My List", href: "/my-list" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        <button className="vp-icon-btn" aria-label="Search">
          ⌕
        </button>
        <button className="vp-icon-btn" aria-label="Notifications">
          ◔
        </button>
        <div className="vp-avatar" />
      </div>
    </nav>
  );
}
