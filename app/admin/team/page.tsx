import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { Notice } from "@/components/Notice";
import { requireRole } from "@/lib/guard";
import { badge, badgeOff, btn, btnDanger, btnGhost, eyebrow, input, pageTitle, rowCard } from "@/lib/ui";
import { addAdmin, setAdminActive } from "./actions";

export const metadata = { title: "Tim admin | coscheck" };

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireRole(["owner"]);
  const { error, ok } = await searchParams;

  const all = await db
    .select()
    .from(users)
    .orderBy(desc(users.role), desc(users.active), asc(users.createdAt));

  return (
    <>
      <p className={eyebrow}>Khusus owner</p>
      <h1 className={pageTitle}>
        TIM <span className="text-accent">ADMIN.</span>
      </h1>
      <p className="mt-4 max-w-[560px] text-sm leading-[1.7] text-muted">
        Admin masuk pakai akun Google dengan email yang kamu daftarkan di sini.
        Menonaktifkan admin tidak menghapus riwayatnya.
      </p>

      <Notice error={error} ok={ok} />

      <form action={addAdmin} className="mt-6 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-[11px] font-bold">
          Email Google
          <input type="email" name="email" required placeholder="nama@gmail.com" className={`${input} w-64`} />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-bold">
          Nama (opsional)
          <input name="name" maxLength={80} placeholder="Nama panggilan" className={`${input} w-48`} />
        </label>
        <button type="submit" className={btn}>
          Tambah admin
        </button>
      </form>

      <ul className="mt-8 grid gap-2.5">
        {all.map((u) => (
          <li key={u.id} className={rowCard}>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="truncate text-[13px]">{u.name ?? u.email}</strong>
                <span className={badge}>{u.role}</span>
                {u.active !== 1 && <span className={badgeOff}>nonaktif</span>}
              </div>
              <div className="mt-1 truncate text-[11px] text-muted">
                {u.email} · sejak {u.createdAt.slice(0, 10)}
              </div>
            </div>

            {u.role === "admin" && (
              <form action={setAdminActive}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="active" value={u.active === 1 ? "0" : "1"} />
                <button type="submit" className={u.active === 1 ? btnDanger : btnGhost}>
                  {u.active === 1 ? "Nonaktifkan" : "Aktifkan lagi"}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
