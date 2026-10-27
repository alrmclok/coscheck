import { asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { cities, events } from "@/db/schema";
import { Notice } from "@/components/Notice";
import { requireRole } from "@/lib/guard";
import { TIMEZONES, TZ_LABEL } from "@/lib/tz";
import { badgeOff, btn, btnDanger, btnGhost, eyebrow, input, pageTitle, rowCard } from "@/lib/ui";
import { addCity, deleteCity, setCityActive, updateCity } from "./actions";

export const metadata = { title: "Kota — coscheck" };

export default async function CitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireRole(["owner"]);
  const { error, ok } = await searchParams;

  const [list, counts] = await Promise.all([
    db.select().from(cities).orderBy(asc(cities.name)),
    db
      .select({ cityId: events.cityId, n: sql<number>`count(*)` })
      .from(events)
      .groupBy(events.cityId),
  ]);
  const usage = new Map(counts.map((c) => [c.cityId, Number(c.n)]));

  const tzOptions = TIMEZONES.map((tz) => (
    <option key={tz} value={tz}>
      {TZ_LABEL[tz]} ({tz})
    </option>
  ));

  return (
    <>
      <p className={eyebrow}>Khusus owner</p>
      <h1 className={pageTitle}>
        <span className="text-accent">KOTA.</span>
      </h1>
      <p className="mt-4 max-w-[560px] text-sm leading-[1.7] text-muted">
        Daftar kota untuk form acara dan filter di halaman depan. Kota yang
        sudah dipakai acara hanya bisa dinonaktifkan, tidak dihapus.
      </p>

      <Notice error={error} ok={ok} />

      <form action={addCity} className="mt-6 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-[11px] font-bold">
          Nama kota
          <input name="name" required maxLength={60} placeholder="Bandung" className={`${input} w-52`} />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-bold">
          Zona waktu
          <select name="timezone" defaultValue="Asia/Jakarta" className={input}>
            {tzOptions}
          </select>
        </label>
        <button type="submit" className={btn}>
          Tambah kota
        </button>
      </form>

      <ul className="mt-8 grid gap-2.5">
        {list.length === 0 && (
          <li className="border border-dashed border-line p-4 text-xs text-muted">
            Belum ada kota. Tambahkan kota pertama di atas.
          </li>
        )}
        {list.map((c) => {
          const used = usage.get(c.id) ?? 0;
          return (
            <li key={c.id} className={rowCard}>
              <form action={updateCity} className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={c.id} />
                <input name="name" defaultValue={c.name} required maxLength={60} className={`${input} w-44`} />
                <select name="timezone" defaultValue={c.timezone} className={input}>
                  {tzOptions}
                </select>
                <button type="submit" className={btnGhost}>
                  Simpan
                </button>
                <span className="font-mono text-[10px] text-muted">{used} acara</span>
                {c.active !== 1 && <span className={badgeOff}>nonaktif</span>}
              </form>

              <form action={setCityActive}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="active" value={c.active === 1 ? "0" : "1"} />
                <button type="submit" className={btnGhost}>
                  {c.active === 1 ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </form>

              {used === 0 && (
                <form action={deleteCity}>
                  <input type="hidden" name="id" value={c.id} />
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
