"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
  ownerOnly?: boolean;
  adminOnly?: boolean; // hanya untuk admin biasa (owner tidak perlu kirim pesan ke dirinya sendiri)
  badge?: "reports" | "inbox";
};

const links: NavLink[] = [
  { href: "/admin", label: "Beranda" },
  { href: "/admin/events", label: "Acara" },
  { href: "/admin/reports", label: "Laporan", badge: "reports" },
  { href: "/admin/message", label: "Pesan ke owner", adminOnly: true },
  { href: "/admin/inbox", label: "Kotak masuk", ownerOnly: true, badge: "inbox" },
  { href: "/admin/team", label: "Tim admin", ownerOnly: true },
  { href: "/admin/cities", label: "Kota", ownerOnly: true },
  { href: "/admin/types", label: "Jenis acara", ownerOnly: true },
  { href: "/admin/audit", label: "Log audit", ownerOnly: true },
];

export function AdminNav({
  isOwner,
  counts = { reports: 0, inbox: 0 },
}: {
  isOwner: boolean;
  counts?: { reports: number; inbox: number };
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu admin" className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-bold">
      {links
        .filter((l) => (isOwner || !l.ownerOnly) && !(isOwner && l.adminOnly))
        .map((l) => {
          const active =
            l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          const n = l.badge ? counts[l.badge] : 0;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={active ? "text-accent underline underline-offset-[7px]" : "text-ink"}
            >
              {l.label}
              {n > 0 && (
                <span className="ml-1.5 inline-block bg-accent px-1.5 py-[2px] align-middle font-mono text-[9px] text-white">
                  {n}
                </span>
              )}
            </Link>
          );
        })}
    </nav>
  );
}
