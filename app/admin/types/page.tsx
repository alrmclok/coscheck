import { asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { eventTypes, events } from "@/db/schema";
import { Notice } from "@/components/Notice";
import { requireRole } from "@/lib/guard";
import { badgeOff, btn, btnDanger, btnGhost, eyebrow, input, pageTitle, rowCard } from "@/lib/ui";
import { addType, deleteType, renameType, seedTypes, setTypeActive } from "./actions";

export const metadata = { title: "Jenis acara | coscheck" };

export default async function TypesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireRole(["owner"]);
  const { error, ok } = await searchParams;

  const [list, counts] = await Promise.all([
    db.select().from(eventTypes).orderBy(asc(eventTypes.name)),
    db
      .select({ typeId: events.typeId, n: sql<number>`count(*)` })
      .from(events)
      .groupBy(events.typeId),
  ]);
  const usage = new Map(counts.map((c) => [c.typeId, Number(c.n)]));

  return (
    <>
      <p className={eyebrow}>Khusus owner</p>
      <h1 className={pageTitle}>
        JENIS <span className="text-accent">ACARA.</span>
      </h1>
      <p className="mt-4 max-w-[560px] text-sm leading-[1.7] text-muted">
        Jenis acara muncul di form acara dan filter halaman depan. Jenis yang
        sudah dipakai acara hanya bisa dinonaktifkan, tidak dihapus.
      </p>

      <Notice error={error} ok={ok} />

      <form action={addType} className="mt-6 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-[11px] font-bold">
          Nama jenis
          <input name="name" required maxLength={40} placeholder="Konvensi" className={`${input} w-52`} />
        </label>
        <button type="submit" className={btn}>
          Tambah jenis
        </button>
      </form>

      <ul className="mt-8 grid gap-2.5">
        {list.length === 0 && (
          <li className="flex flex-wrap items-center justify-between gap-3 border border-dashed border-line p-4 text-xs text-muted">
            Belum ada jenis acara.
            <form action={seedTypes}>
              <button type="submit" className={btnGhost}>
                Isi jenis bawaan (Konvensi, Meetup, Foto bareng, Kompetisi)
              </button>
            </form>
          </li>
        )}
        {list.map((t) => {
          const used = usage.get(t.id) ?? 0;
          return (
            <li key={t.id} className={rowCard}>
              <form action={renameType} className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={t.id} />
                <input name="name" defaultValue={t.name} required maxLength={40} className={`${input} w-52`} />
                <button type="submit" className={btnGhost}>
                  Simpan
                </button>
                <span className="font-mono text-[10px] text-muted">{used} acara</span>
                {t.active !== 1 && <span className={badgeOff}>nonaktif</span>}
              </form>

              <form action={setTypeActive}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="active" value={t.active === 1 ? "0" : "1"} />
                <button type="submit" className={btnGhost}>
                  {t.active === 1 ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </form>

              {used === 0 && (
                <form action={deleteType}>
                  <input type="hidden" name="id" value={t.id} />
                  <button type="submit" className={btnDanger}>
                    Hapus
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
