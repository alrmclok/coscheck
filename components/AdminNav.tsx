"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Beranda", ownerOnly: false },
  { href: "/admin/events", label: "Acara", ownerOnly: false },
  { href: "/admin/team", label: "Tim admin", ownerOnly: true },
  { href: "/admin/cities", label: "Kota", ownerOnly: true },
  { href: "/admin/types", label: "Jenis acara", ownerOnly: true },
];

export function AdminNav({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu admin" className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-bold">
      {links
        .filter((l) => isOwner || !l.ownerOnly)
        .map((l) => {
          const active =
            l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={active ? "text-accent underline underline-offset-[7px]" : "text-ink"}
            >
              {l.label}
            </Link>
          );
        })}
    </nav>
  );
}
