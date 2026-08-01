import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Velvet Admin",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-shell">{children}</div>;
}
