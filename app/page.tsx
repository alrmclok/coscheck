import Link from "next/link";
import PublicEventCard from "@/components/PublicEventCard";
import { getFilterOptions, getPublicEvents, PAGE_SIZE, type Tab } from "@/lib/public-events";
import { btn, btnGhost, eyebrow, input, shell } from "@/lib/ui";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

function one(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  const t = s?.trim();
  return t ? t : undefined;
}

function monthOptions(tab: Tab) {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000); // WIB
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const label = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(y, tab === "past" ? m - i : m + i, 1));
    const value = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return { value, label: label.format(d) };
  });
}

function href(p: { tab: Tab; city?: string; type?: string; month?: string; q?: string; limit?: number }) {
  const sp = new URLSearchParams();
  if (p.tab === "past") sp.set("tab", "past");
  if (p.city) sp.set("city", p.city);
  if (p.type) sp.set("type", p.type);
  if (p.month) sp.set("month", p.month);
  if (p.q) sp.set("q", p.q);
  if (p.limit && p.limit > PAGE_SIZE) sp.set("limit", String(p.limit));
  const s = sp.toString();
  return s ? `/?${s}` : "/";
}

export default async function HomePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const tab: Tab = one(sp.tab) === "past" ? "past" : "upcoming";
  const city = one(sp.city);
  const type = one(sp.type);
  const month = one(sp.month);
  const q = one(sp.q)?.slice(0, 80);
  const limit = Math.min(Math.max(parseInt(one(sp.limit) ?? "", 10) || PAGE_SIZE, PAGE_SIZE), 240);

  const [options, { items, hasMore }] = await Promise.all([
    getFilterOptions(),
    getPublicEvents({ tab, city, type, month, q, limit }),
  ]);
  const months = monthOptions(tab);
  const filtered = !!(city || type || month || q);

  const tabCls = (active: boolean) =>
    active
      ? "border border-ink bg-ink px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-paper"
      : "border border-ink bg-card px-4 py-1.5 font-mono text-xs uppercase tracking-wider hover:bg-sand";

  return (
    <div className={`${shell} py-10`}>
      <header className="mb-8">
        <p className={eyebrow}>Cek dulu, baru berangkat</p>
        <h1 className="font-display text-4xl font-bold uppercase leading-tight sm:text-5xl">
          Acara cosplay <span className="text-accent">terdekat</span>
        </h1>
      </header>

      <div className="mb-4 flex gap-2">
        <Link href={href({ tab: "upcoming", city, type, q })} className={tabCls(tab === "upcoming")}>
          Akan datang
        </Link>
        <Link href={href({ tab: "past", city, type, q })} className={tabCls(tab === "past")}>
          Sudah lewat
        </Link>
      </div>

      <form action="/" method="get" className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        {tab === "past" && <input type="hidden" name="tab" value="past" />}
        <input type="search" name="q" defaultValue={q} placeholder="Cari judul acara…" maxLength={80} className={input} />
        <select name="city" defaultValue={city ?? ""} className={input} aria-label="Kota">
          <option value="">Semua kota</option>
          {options.cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select name="month" defaultValue={month ?? ""} className={input} aria-label="Bulan">
          <option value="">Semua bulan</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <select name="type" defaultValue={type ?? ""} className={input} aria-label="Jenis acara">
          <option value="">Semua jenis</option>
          {options.types.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="submit" className={btn}>Cari</button>
          {filtered && (
            <Link href={href({ tab })} className={btnGhost}>Reset</Link>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <div className="border border-dashed border-ink bg-card p-10 text-center">
          <p className="font-display text-lg font-bold">
            {filtered ? "Tidak ada acara yang cocok." : tab === "past" ? "Belum ada acara yang sudah lewat." : "Belum ada acara yang akan datang."}
          </p>
          <p className="mt-1 text-sm text-muted">
            {filtered ? "Coba ubah atau reset filternya." : "Cek lagi nanti ya."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((e) => (
            <PublicEventCard key={e.id} e={e} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-8 text-center">
          <Link href={href({ tab, city, type, month, q, limit: limit + PAGE_SIZE })} scroll={false} className={btnGhost}>
            Tampilkan lebih banyak
          </Link>
        </div>
      )}

      <p className="mt-10 border border-line bg-trust px-4 py-3 text-center font-mono text-xs">
        Cek tanggal verifikasinya sebelum berangkat.
      </p>
    </div>
  );
}
