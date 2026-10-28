import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { events, reports } from "@/db/schema";
import { Notice } from "@/components/Notice";
import { requireRole } from "@/lib/guard";
import { REASON_LABEL, formatDbTime } from "@/lib/reports";
import { badge, badgeOff, btnDanger, btnGhost, eyebrow, pageTitle } from "@/lib/ui";
import { resolveReports } from "./actions";

export const metadata = { title: "Laporan — coscheck" };

const STATUS_LABEL = { draft: "Draft", published: "Terbit", archived: "Arsip" } as const;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireRole();
  const { error, ok } = await searchParams;

  const rows = await db
    .select({
      id: reports.id,
      eventId: reports.eventId,
      reason: reports.reason,
      note: reports.note,
      createdAt: reports.createdAt,
      title: events.title,
      slug: events.slug,
      status: events.status,
      isCancelled: events.isCancelled,
    })
    .from(reports)
    .innerJoin(events, eq(reports.eventId, events.id))
    .where(eq(reports.status, "open"))
    .orderBy(desc(reports.createdAt));

  // Kelompokkan per acara (rows sudah terbaru dulu)
  const groups = new Map<string, { head: (typeof rows)[number]; items: typeof rows }>();
  for (const r of rows) {
    const g = groups.get(r.eventId);
    if (g) g.items.push(r);
    else groups.set(r.eventId, { head: r, items: [r] });
  }
  const list = [...groups.values()].sort(
    (a, b) => b.items.length - a.items.length || b.head.createdAt.localeCompare(a.head.createdAt),
  );

  return (
    <>
      <p className={eyebrow}>Panel admin</p>
      <h1 className={pageTitle}>
        <span className="text-accent">LAPORAN.</span>
      </h1>
      <p className="mt-4 max-w-[560px] text-sm leading-[1.7] text-muted">
        Cek dulu ke postingan asli, perbaiki acaranya kalau perlu, lalu tekan Selesai. Yang paling banyak dilaporkan
        ada di atas.
      </p>

      <Notice error={error} ok={ok} />

      <ul className="mt-6 grid gap-2.5">
        {list.length === 0 && (
          <li className="border border-dashed border-line p-4 text-xs text-muted">
            Tidak ada laporan terbuka. Semua beres.
          </li>
        )}
        {list.map(({ head, items }) => {
          const counts = new Map<string, number>();
          for (const r of items) counts.set(r.reason, (counts.get(r.reason) ?? 0) + 1);
          const summary = [...counts].map(([k, n]) => `${REASON_LABEL[k as keyof typeof REASON_LABEL]} ×${n}`).join(", ");

          return (
            <li key={head.eventId} className="border border-ink bg-card p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/events/${head.eventId}`}
                    className="font-display text-base font-bold leading-snug tracking-[-.3px] hover:text-accent"
                  >
                    {head.title}
                  </Link>
                  <div className="mt-1 text-[11px] text-muted">{summary}</div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={badge}>{items.length} laporan</span>
                  {head.isCancelled === 1 && (
                    <span className="bg-accent px-1.5 py-[3px] font-mono text-[9px] uppercase tracking-[.6px] text-white">
                      Dibatalkan
                    </span>
                  )}
                  {head.status !== "published" && <span className={badgeOff}>{STATUS_LABEL[head.status]}</span>}
                </div>
              </div>

              <ul className="mt-3 grid gap-2 border-t border-dashed border-line pt-3">
                {items.map((r) => (
                  <li key={r.id} className="text-xs leading-normal">
                    <span className="font-bold">{REASON_LABEL[r.reason]}</span>
                    <span className="ml-2 font-mono text-[10px] text-muted">{formatDbTime(r.createdAt)}</span>
                    {r.note && <p className="mt-0.5 whitespace-pre-line text-muted">{r.note}</p>}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-line pt-3">
                <Link
                  href={`/admin/events/${head.eventId}`}
                  className="inline-flex items-center border border-ink bg-ink px-3.5 py-2 text-xs font-extrabold text-paper"
                >
                  Edit acara
                </Link>
                {head.status === "published" && (
                  <Link href={`/events/${head.slug}`} className={btnGhost} target="_blank" rel="noopener noreferrer">
                    Lihat halaman publik
                  </Link>
                )}
                <form action={resolveReports}>
                  <input type="hidden" name="eventId" value={head.eventId} />
                  <button type="submit" className={btnGhost}>
                    Selesai
                  </button>
                </form>
                {head.isCancelled !== 1 && head.status !== "archived" && (
                  <form action={resolveReports}>
                    <input type="hidden" name="eventId" value={head.eventId} />
                    <input type="hidden" name="cancel" value="1" />
                    <button type="submit" className={btnDanger}>
                      Tandai dibatalkan &amp; selesai
                    </button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
