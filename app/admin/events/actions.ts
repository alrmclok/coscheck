"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { cities, eventImages, eventTickets, eventTypes, events } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { REQUIRE_COVER_TO_PUBLISH, localToUtcIso, makeSlug, parseEventForm, type SaveState } from "@/lib/events";
import { back } from "@/lib/flash";
import { requireRole } from "@/lib/guard";

/** Hanya izinkan redirect ke halaman acara admin (tanpa query). */
function safeNext(v: FormDataEntryValue | null): string {
  const s = typeof v === "string" ? v : "";
  return /^\/admin\/events(\/[A-Za-z0-9-]+)?$/.test(s) ? s : "/admin/events";
}

const now = () => sql`(datetime('now'))`;

// ---------- Simpan (buat baru / edit) ----------

export async function saveEvent(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const me = await requireRole();

  const parsed = parseEventForm(formData);
  if (!parsed.ok) return { error: parsed.error, values: parsed.values };
  const f = parsed.data;
  const fail = (error: string): SaveState => ({ error, values: Object.fromEntries(
    ["title","description","typeId","cityId","start","end","venueName","mapsUrl","organizer","sourceUrl","ticketMode"].map((k) => [k, String(formData.get(k) ?? "")]),
  ) });

  const idRaw = String(formData.get("id") ?? "");
  const [existing] = idRaw
    ? await db.select().from(events).where(eq(events.id, idRaw)).limit(1)
    : [];
  if (idRaw && !existing) return fail("Acara tidak ditemukan.");

  const [city] = await db.select().from(cities).where(eq(cities.id, f.cityId)).limit(1);
  if (!city) return fail("Kota tidak ditemukan.");
  if (city.active !== 1 && existing?.cityId !== city.id) return fail("Kota itu sudah dinonaktifkan.");

  if (f.typeId) {
    const [type] = await db.select().from(eventTypes).where(eq(eventTypes.id, f.typeId)).limit(1);
    if (!type) return fail("Jenis acara tidak ditemukan.");
    if (type.active !== 1 && existing?.typeId !== type.id) return fail("Jenis acara itu sudah dinonaktifkan.");
  }

  if (f.sourceUrl) {
    const [dupe] = await db
      .select({ id: events.id, title: events.title })
      .from(events)
      .where(existing ? and(eq(events.sourceUrl, f.sourceUrl), ne(events.id, existing.id)) : eq(events.sourceUrl, f.sourceUrl))
      .limit(1);
    if (dupe) return fail(`Postingan Instagram ini sudah dipakai acara "${dupe.title}".`);
  }

  const startAt = localToUtcIso(f.start, city.timezone);
  const endAt = localToUtcIso(f.end, city.timezone);

  const columns = {
    title: f.title,
    description: f.description,
    typeId: f.typeId,
    cityId: f.cityId,
    timezone: city.timezone,
    startAt,
    endAt,
    venueName: f.venueName,
    mapsUrl: f.mapsUrl,
    organizer: f.organizer,
    ticketMode: f.ticketMode,
    sourceUrl: f.sourceUrl,
  };

  const ticketRows = (eventId: string) =>
    f.tickets.map((t, i) => ({ eventId, name: t.name, priceIdr: t.priceIdr, url: t.url, position: i }));

  if (existing) {
    await db.transaction(async (tx) => {
      await tx
        .update(events)
        .set({ ...columns, updatedBy: me.id, updatedAt: now() })
        .where(eq(events.id, existing.id));
      await tx.delete(eventTickets).where(eq(eventTickets.eventId, existing.id));
      if (f.tickets.length) await tx.insert(eventTickets).values(ticketRows(existing.id));
    });
    await logAudit(me.id, "event.update", existing.id, { title: f.title });
    back(`/admin/events/${existing.id}`, { ok: "Perubahan disimpan." });
  }

  const id = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(events).values({
      id,
      slug: makeSlug(f.title),
      ...columns,
      status: "draft",
      createdBy: me.id,
    });
    if (f.tickets.length) await tx.insert(eventTickets).values(ticketRows(id));
  });
  await logAudit(me.id, "event.create", id, { title: f.title });
  back(`/admin/events/${id}`, { ok: "Acara dibuat sebagai draft." });
}

// ---------- Status ----------

const ALLOWED: Record<string, string[]> = {
  draft: ["published", "archived"],
  published: ["draft", "archived"],
  archived: ["draft"],
};

export async function setEventStatus(formData: FormData) {
  const me = await requireRole();
  const next = safeNext(formData.get("next"));

  const parsed = z
    .object({ id: z.string().min(1), to: z.enum(["draft", "published", "archived"]) })
    .safeParse({ id: formData.get("id"), to: formData.get("to") });
  if (!parsed.success) back(next, { error: "Data tidak valid." });

  const { id, to } = parsed.data;
  const [ev] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!ev) back(next, { error: "Acara tidak ditemukan." });
  if (!ALLOWED[ev.status].includes(to)) back(next, { error: "Perubahan status itu tidak diizinkan." });

  if (to === "published" && REQUIRE_COVER_TO_PUBLISH) {
    const [row] = await db
      .select({ n: sql<number>`count(*)` })
      .from(eventImages)
      .where(eq(eventImages.eventId, id));
    if (Number(row?.n ?? 0) < 1) {
      back(next, { error: "Acara belum bisa dipublikasikan: tambahkan minimal satu gambar (gambar pertama jadi cover)." });
    }
  }

  const verifyNow = to === "published" && !ev.lastVerifiedAt;
  await db
    .update(events)
    .set({
      status: to,
      updatedBy: me.id,
      updatedAt: now(),
      ...(verifyNow ? { lastVerifiedAt: new Date().toISOString(), verifiedBy: me.id } : {}),
    })
    .where(eq(events.id, id));

  const action =
    to === "published" ? "event.publish" : to === "archived" ? "event.archive" : ev.status === "archived" ? "event.restore" : "event.unpublish";
  await logAudit(me.id, action, id, { title: ev.title });

  const msg = { published: "Acara dipublikasikan.", archived: "Acara diarsipkan.", draft: ev.status === "archived" ? "Acara dikembalikan sebagai draft." : "Acara dikembalikan jadi draft." }[to];
  back(next, { ok: msg });
}

export async function toggleCancelled(formData: FormData) {
  const me = await requireRole();
  const next = safeNext(formData.get("next"));

  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) back(next, { error: "Data tidak valid." });

  const [ev] = await db.select().from(events).where(eq(events.id, id.data)).limit(1);
  if (!ev) back(next, { error: "Acara tidak ditemukan." });

  const cancelled = ev.isCancelled === 1 ? 0 : 1;
  await db
    .update(events)
    .set({ isCancelled: cancelled, updatedBy: me.id, updatedAt: now() })
    .where(eq(events.id, ev.id));
  await logAudit(me.id, cancelled ? "event.cancel" : "event.uncancel", ev.id, { title: ev.title });

  back(next, { ok: cancelled ? "Acara ditandai dibatalkan." : "Tanda batal dicabut." });
}

export async function markVerified(formData: FormData) {
  const me = await requireRole();
  const next = safeNext(formData.get("next"));

  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) back(next, { error: "Data tidak valid." });

  const [ev] = await db.select().from(events).where(eq(events.id, id.data)).limit(1);
  if (!ev) back(next, { error: "Acara tidak ditemukan." });
  if (ev.status !== "published") back(next, { error: "Hanya acara yang sudah dipublikasikan yang bisa diverifikasi." });

  await db
    .update(events)
    .set({ lastVerifiedAt: new Date().toISOString(), verifiedBy: me.id })
    .where(eq(events.id, ev.id));
  await logAudit(me.id, "event.verify", ev.id, { title: ev.title });

  back(next, { ok: "Ditandai terverifikasi hari ini." });
}

// ---------- Hapus permanen (owner) ----------

export async function deleteEvent(formData: FormData) {
  const me = await requireRole(["owner"]);

  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) back("/admin/events", { error: "Data tidak valid." });

  const [ev] = await db.select().from(events).where(eq(events.id, id.data)).limit(1);
  if (!ev) back("/admin/events", { error: "Acara tidak ditemukan." });

  // M3B: hapus gambar di Cloudinary dulu sebelum baris database dihapus.
  await db.delete(events).where(eq(events.id, ev.id)); // tiket, gambar, laporan ikut terhapus (cascade)
  await logAudit(me.id, "event.delete", ev.id, { title: ev.title });

  back("/admin/events", { ok: `Acara "${ev.title}" dihapus permanen.` });
}
