import Link from "next/link";
import { requireRole } from "@/lib/guard";
import { getNavCounts } from "@/lib/nav-counts";
import { eyebrow, pageTitle } from "@/lib/ui";

export const metadata = { title: "Admin | coscheck" };

type Card = { href: string; title: string; desc: string; badge?: "reports" | "inbox" };

const adminLinks: Card[] = [
  { href: "/admin/events", title: "Acara", desc: "Tambah, edit, publikasikan, dan verifikasi acara." },
  { href: "/admin/reports", title: "Laporan", desc: "Cek laporan dari pengunjung: tanggal, lokasi, atau harga yang salah.", badge: "reports" },
];

const adminOnlyLinks: Card[] = [
  { href: "/admin/message", title: "Pesan ke owner", desc: "Minta tambah kota atau jenis acara, lapor bug, atau kirim saran." },
];

const ownerLinks: Card[] = [
  { href: "/admin/inbox", title: "Kotak masuk", desc: "Pesan dari admin: permintaan, bug, dan saran.", badge: "inbox" },
  { href: "/admin/team", title: "Tim admin", desc: "Tambah atau nonaktifkan admin." },
  { href: "/admin/cities", title: "Kota", desc: "Kelola daftar kota dan zona waktunya." },
  { href: "/admin/types", title: "Jenis acara", desc: "Kelola jenis acara (konvensi, meetup, dll)." },
  { href: "/admin/audit", title: "Log audit", desc: "Riwayat aksi admin dan owner." },
];

export default async function AdminHome() {
  const user = await requireRole();
  const isOwner = user.role === "owner";
  const firstName = (user.name ?? "admin").split(" ")[0].toUpperCase();
  const counts = await getNavCounts(isOwner);
  const cards = [...adminLinks, ...(isOwner ? ownerLinks : adminOnlyLinks)];

  return (
    <>
      <p className={eyebrow}>Panel admin</p>
      <h1 className={pageTitle}>
        HALO, <span className="text-accent">{firstName}.</span>
      </h1>
      <p className="mt-4 max-w-[560px] text-sm leading-[1.7] text-muted">
        Kelola acara, cek laporan pengunjung, dan kirim masukan ke owner dari sini.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {cards.map((l) => {
          const n = l.badge ? counts[l.badge] : 0;
          return (
            <Link
              key={l.href}
              href={l.href}
              className="border border-ink bg-card p-4 shadow-[3px_3px_0_var(--color-ink)]"
            >
              <strong className="block font-display text-[15px]">
                {l.title}
                {n > 0 && (
                  <span className="ml-2 inline-block bg-accent px-1.5 py-[2px] align-middle font-mono text-[9px] font-medium text-on-accent">
                    {n}
                  </span>
                )}
              </strong>
              <span className="mt-1 block text-xs leading-normal text-muted">{l.desc}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
