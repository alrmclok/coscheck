import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cities, eventTypes, events } from "@/db/schema";
import { EventActions } from "@/components/EventActions";
import { Notice } from "@/components/Notice";
import { formatEventDate, formatShortDate, isStale } from "@/lib/events";
import { requireRole } from "@/lib/guard";
import { TZ_LABEL } from "@/lib/tz";
import { badge, badgeOff, btn, eyebrow, pageTitle } from "@/lib/ui";

export const metadata = { title: "Acara — coscheck" };

const TABS = [
  { key: "all", label: "Semua" },
  { key: "draft", label: "Draft" },
  { key: "published", label: "Terbit" },
  { key: "archived", label: "Arsip" },
] as const;

const STATUS_LABEL = { draft: "Draft", published: "Terbit", archived: "Arsip" } as const;

export default async function EventsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string; ok?: string }>;
}) {
  await requireRole();
  const { status, error, ok } = await searchParams;
  const filter = TABS.some((t) => t.key === status) && status !== "all" ? (status as keyof typeof STATUS_LABEL) : null;

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      status: events.status,
      isCancelled: events.isCancelled,
      startAt: events.startAt,
      endAt: events.endAt,
      timezone: events.timezone,
      lastVerifiedAt: events.lastVerifiedAt,
      cityName: cities.name,
      typeName: eventTypes.name,
      openReports: sql<number>`(select count(*) from reports r where r.event_id = ${events.id} and r.status = 'open')`,
    })
    .from(events)
    .innerJoin(cities, eq(events.cityId, cities.id))
    .leftJoin(eventTypes, eq(events.typeId, eventTypes.id))
    .where(filter ? eq(events.status, filter) : undefined)
    .orderBy(desc(events.startAt));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={eyebrow}>Panel admin</p>
          <h1 className={pageTitle}>
            <span className="text-accent">ACARA.</span>
          </h1>
        </div>
        <Link href="/admin/events/new" className={btn}>
          Tambah acara
        </Link>
      </div>

      <Notice error={error} ok={ok} />

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filter status">
        {TABS.map((t) => {
          const active = (filter ?? "all") === t.key;
          return (
            <Link
              key={t.key}
              href={t.key === "all" ? "/admin/events" : `/admin/events?status=${t.key}`}
              className={`border px-3 py-1.5 text-xs font-semibold ${active ? "border-ink bg-ink text-paper" : "border-line bg-card"}`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <ul className="mt-5 grid gap-2.5">
        {rows.length === 0 && (
          <li className="border border-dashed border-line p-4 text-xs text-muted">
            Belum ada acara di sini. Kalau kota atau jenis acara belum ada, minta owner menambahkannya dulu.
          </li>
        )}
        {rows.map((e) => {
          const tz = e.timezone as keyof typeof TZ_LABEL;
          const stale = e.lastVerifiedAt ? isStale(e.lastVerifiedAt) : false;
          return (
            <li key={e.id} className="border border-ink bg-card p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/admin/events/${e.id}`} className="font-display text-base font-bold leading-snug tracking-[-.3px] hover:text-accent">
                    {e.title}
                  </Link>
                  <div className="mt-1 text-[11px] text-muted">
                    {formatEventDate(e.startAt, e.endAt, tz)} · {e.cityName}
                    {e.typeName ? ` · ${e.typeName}` : ""}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={badge}>{STATUS_LABEL[e.status]}</span>
                  {e.isCancelled === 1 && <span className="bg-accent px-1.5 py-[3px] font-mono text-[9px] uppercase tracking-[.6px] text-white">Dibatalkan</span>}
                  {Number(e.openReports) > 0 && <span className={badgeOff}>{Number(e.openReports)} laporan</span>}
                </div>
              </div>

              <div className={`mt-2 font-mono text-[10px] ${stale ? "text-[#9a6a22]" : "text-muted"}`}>
                {e.lastVerifiedAt
                  ? `Diverifikasi ${formatShortDate(e.lastVerifiedAt, tz)}${stale ? " (sudah lama)" : ""}`
                  : "Belum diverifikasi"}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-line pt-3">
                <Link href={`/admin/events/${e.id}`} className="inline-flex items-center border border-ink bg-ink px-3.5 py-2 text-xs font-extrabold text-paper">
                  Edit
                </Link>
                <EventActions id={e.id} status={e.status} isCancelled={e.isCancelled === 1} next="/admin/events" />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
