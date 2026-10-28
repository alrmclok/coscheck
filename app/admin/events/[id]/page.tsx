import { asc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { cities, eventImages, eventTickets, eventTypes, events, reports } from "@/db/schema";
import { EventActions } from "@/components/EventActions";
import { EventForm } from "@/components/EventForm";
import { Notice } from "@/components/Notice";
import { formatShortDate, isStale, utcIsoToLocalInput } from "@/lib/events";
import { requireRole } from "@/lib/guard";
import { TZ_LABEL, type Timezone } from "@/lib/tz";
import { badge, btnDanger, eyebrow, pageTitle, sectionTitle } from "@/lib/ui";
import { deleteEvent } from "../actions";

export const metadata = { title: "Edit acara — coscheck" };
export const maxDuration = 60;

const STATUS_LABEL = { draft: "Draft", published: "Terbit", archived: "Arsip" } as const;

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const me = await requireRole();
  const { id } = await params;
  const { error, ok } = await searchParams;

  const [ev] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!ev) notFound();

  const [tickets, images, cityList, typeList, [reportRow]] = await Promise.all([
    db.select().from(eventTickets).where(eq(eventTickets.eventId, id)).orderBy(asc(eventTickets.position)),
    db.select().from(eventImages).where(eq(eventImages.eventId, id)).orderBy(asc(eventImages.position)),
    db.select().from(cities).orderBy(asc(cities.name)),
    db.select().from(eventTypes).orderBy(asc(eventTypes.name)),
    db
      .select({ n: sql<number>`count(*)` })
      .from(reports)
      .where(sql`${reports.eventId} = ${id} and ${reports.status} = 'open'`),
  ]);

  const tz = ev.timezone as Timezone;
  const stale = ev.lastVerifiedAt ? isStale(ev.lastVerifiedAt) : false;
  const openReports = Number(reportRow?.n ?? 0);

  return (
    <>
      <p className={eyebrow}>Edit acara</p>
      <h1 className={`${pageTitle} text-[clamp(26px,4vw,40px)]`}>{ev.title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={badge}>{STATUS_LABEL[ev.status]}</span>
        {ev.isCancelled === 1 && (
          <span className="bg-accent px-1.5 py-[3px] font-mono text-[9px] uppercase tracking-[.6px] text-white">Dibatalkan</span>
        )}
        <span className={`font-mono text-[10px] ${stale ? "text-[#9a6a22]" : "text-muted"}`}>
          {ev.lastVerifiedAt
            ? `Diverifikasi ${formatShortDate(ev.lastVerifiedAt, tz)}${stale ? " (sudah lama)" : ""}`
            : "Belum diverifikasi"}
        </span>
        {openReports > 0 && <span className="font-mono text-[10px] text-accent">{openReports} laporan terbuka</span>}
      </div>

      <div className="mt-4">
        <EventActions id={ev.id} status={ev.status} isCancelled={ev.isCancelled === 1} next={`/admin/events/${ev.id}`} />
      </div>

      <Notice error={error} ok={ok} />

      <div className="mt-6">
        <EventForm
          key={ev.updatedAt}
          initial={{
            id: ev.id,
            title: ev.title,
            description: ev.description ?? "",
            typeId: ev.typeId ?? "",
            cityId: ev.cityId,
            start: utcIsoToLocalInput(ev.startAt, tz),
            end: utcIsoToLocalInput(ev.endAt, tz),
            venueName: ev.venueName ?? "",
            mapsUrl: ev.mapsUrl ?? "",
            organizer: ev.organizer ?? "",
            sourceUrl: ev.sourceUrl ?? "",
            ticketMode: ev.ticketMode,
          }}
          images={images.map((i) => ({ cloudinaryId: i.cloudinaryId, url: i.url, width: i.width, height: i.height }))}
          tickets={tickets.map((t) => ({ name: t.name ?? "", price: String(t.priceIdr), url: t.url ?? "" }))}
          cities={cityList
            .filter((c) => c.active === 1 || c.id === ev.cityId)
            .map((c) => ({ id: c.id, name: c.name, label: TZ_LABEL[c.timezone] }))}
          types={typeList.filter((t) => t.active === 1 || t.id === ev.typeId).map((t) => ({ id: t.id, name: t.name }))}
        />
      </div>

      {me.role === "owner" && (
        <>
          <h2 className={sectionTitle}>Zona berbahaya</h2>
          <details className="border border-accent bg-card p-3.5">
            <summary className="cursor-pointer text-xs font-bold text-accent">Hapus acara ini secara permanen</summary>
            <p className="mt-3 text-xs leading-normal text-muted">
              Tiket, gambar, dan laporan acara ini ikut terhapus dan tidak bisa dikembalikan. Kalau cuma ingin menyembunyikan, pakai Arsipkan.
            </p>
            <form action={deleteEvent} className="mt-3">
              <input type="hidden" name="id" value={ev.id} />
              <button type="submit" className={btnDanger}>
                Ya, hapus permanen
              </button>
            </form>
          </details>
        </>
      )}
    </>
  );
}
