"use server";

import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { cities, events } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { back } from "@/lib/flash";
import { requireRole } from "@/lib/guard";
import { TIMEZONES } from "@/lib/tz";

const PATH = "/admin/cities";

const fields = {
  name: z.string().trim().min(2, "Nama kota minimal 2 huruf.").max(60),
  timezone: z.enum(TIMEZONES, "Zona waktu tidak valid."),
};

async function nameTaken(name: string, exceptId?: string) {
  const rows = await db
    .select({ id: cities.id })
    .from(cities)
    .where(sql`lower(${cities.name}) = ${name.toLowerCase()}`);
  return rows.some((r) => r.id !== exceptId);
}

async function eventCount(cityId: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(events)
    .where(eq(events.cityId, cityId));
  return Number(row?.n ?? 0);
}

export async function addCity(formData: FormData) {
  const me = await requireRole(["owner"]);

  const parsed = z
    .object(fields)
    .safeParse({ name: formData.get("name"), timezone: formData.get("timezone") });
  if (!parsed.success) back(PATH, { error: parsed.error.issues[0].message });

  const { name, timezone } = parsed.data;
  if (await nameTaken(name)) back(PATH, { error: `Kota "${name}" sudah ada.` });

  const id = crypto.randomUUID();
  await db.insert(cities).values({ id, name, timezone });
  await logAudit(me.id, "city.add", id, { name, timezone });

  back(PATH, { ok: `Kota ${name} ditambahkan.` });
}

export async function updateCity(formData: FormData) {
  const me = await requireRole(["owner"]);

  const parsed = z
    .object({ id: z.string().min(1), ...fields })
    .safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      timezone: formData.get("timezone"),
    });
  if (!parsed.success) back(PATH, { error: parsed.error.issues[0].message });

  const { id, name, timezone } = parsed.data;

  const [current] = await db.select().from(cities).where(eq(cities.id, id)).limit(1);
  if (!current) back(PATH, { error: "Kota tidak ditemukan." });

  if (await nameTaken(name, id)) back(PATH, { error: `Kota "${name}" sudah ada.` });

  // Acara menyimpan salinan zona waktu kota, jadi jangan diubah kalau sudah dipakai
  if (current.timezone !== timezone && (await eventCount(id)) > 0) {
    back(PATH, {
      error: "Zona waktu tidak bisa diubah karena sudah ada acara di kota ini.",
    });
  }

  await db.update(cities).set({ name, timezone }).where(eq(cities.id, id));
  await logAudit(me.id, "city.update", id, { name, timezone });

  back(PATH, { ok: `Kota ${name} disimpan.` });
}

export async function setCityActive(formData: FormData) {
  const me = await requireRole(["owner"]);

  const parsed = z
    .object({ id: z.string().min(1), active: z.enum(["0", "1"]) })
    .safeParse({ id: formData.get("id"), active: formData.get("active") });
  if (!parsed.success) back(PATH, { error: "Data tidak valid." });

  const { id, active } = parsed.data;
  await db.update(cities).set({ active: Number(active) }).where(eq(cities.id, id));
  await logAudit(me.id, active === "1" ? "city.activate" : "city.deactivate", id);

  back(PATH, { ok: active === "1" ? "Kota diaktifkan." : "Kota dinonaktifkan." });
}

export async function deleteCity(formData: FormData) {
  const me = await requireRole(["owner"]);

  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) back(PATH, { error: "Data tidak valid." });

  const [current] = await db.select().from(cities).where(eq(cities.id, id.data)).limit(1);
  if (!current) back(PATH, { error: "Kota tidak ditemukan." });

  if ((await eventCount(id.data)) > 0) {
    back(PATH, { error: "Kota ini dipakai acara, jadi tidak bisa dihapus. Nonaktifkan saja." });
  }

  await db.delete(cities).where(eq(cities.id, id.data));
  await logAudit(me.id, "city.delete", id.data, { name: current.name });

  back(PATH, { ok: `Kota ${current.name} dihapus.` });
}
