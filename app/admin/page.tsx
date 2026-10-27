import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { eyebrow, pageTitle } from "@/lib/ui";

export const metadata = { title: "Admin — coscheck" };

const ownerLinks = [
  { href: "/admin/team", title: "Tim admin", desc: "Tambah atau nonaktifkan admin." },
  { href: "/admin/cities", title: "Kota", desc: "Kelola daftar kota dan zona waktunya." },
  { href: "/admin/types", title: "Jenis acara", desc: "Kelola jenis acara (konvensi, meetup, dll)." },
];

export default async function AdminHome() {
  const user = await requireRole();
  const firstName = (user.name ?? "admin").split(" ")[0].toUpperCase();

  return (
    <>
      <p className={eyebrow}>Panel admin</p>
      <h1 className={pageTitle}>
        HALO, <span className="text-accent">{firstName}.</span>
      </h1>
      <p className="mt-4 max-w-[560px] text-sm leading-[1.7] text-muted">
        Daftar acara, laporan, dan pesan ke owner akan muncul di sini di
        milestone berikutnya.
      </p>

      {user.role === "owner" && (
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {ownerLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="border border-ink bg-card p-4 shadow-[3px_3px_0_var(--color-ink)]"
            >
              <strong className="block font-display text-[15px]">{l.title}</strong>
              <span className="mt-1 block text-xs leading-normal text-muted">{l.desc}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
