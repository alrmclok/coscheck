"use server";

import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { eventTypes, events } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { back } from "@/lib/flash";
import { requireRole } from "@/lib/guard";

const PATH = "/admin/types";

const nameSchema = z.string().trim().min(2, "Nama jenis minimal 2 huruf.").max(40);

const DEFAULT_TYPES = ["Konvensi", "Meetup", "Foto bareng", "Kompetisi"];

async function nameTaken(name: string, exceptId?: string) {
  const rows = await db
    .select({ id: eventTypes.id })
    .from(eventTypes)
    .where(sql`lower(${eventTypes.name}) = ${name.toLowerCase()}`);
  return rows.some((r) => r.id !== exceptId);
}

async function eventCount(typeId: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(events)
    .where(eq(events.typeId, typeId));
  return Number(row?.n ?? 0);
}

export async function addType(formData: FormData) {
  const me = await requireRole(["owner"]);

  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) back(PATH, { error: parsed.error.issues[0].message });

  const name = parsed.data;
  if (await nameTaken(name)) back(PATH, { error: `Jenis "${name}" sudah ada.` });

  const id = crypto.randomUUID();
  await db.insert(eventTypes).values({ id, name });
  await logAudit(me.id, "type.add", id, { name });

  back(PATH, { ok: `Jenis ${name} ditambahkan.` });
}

export async function seedTypes() {
  const me = await requireRole(["owner"]);

  let added = 0;
  for (const name of DEFAULT_TYPES) {
    if (await nameTaken(name)) continue;
    const id = crypto.randomUUID();
    await db.insert(eventTypes).values({ id, name });
    await logAudit(me.id, "type.add", id, { name });
    added++;
  }

  back(PATH, { ok: `${added} jenis bawaan ditambahkan.` });
}

export async function renameType(formData: FormData) {
  const me = await requireRole(["owner"]);

  const parsed = z
    .object({ id: z.string().min(1), name: nameSchema })
    .safeParse({ id: formData.get("id"), name: formData.get("name") });
  if (!parsed.success) back(PATH, { error: parsed.error.issues[0].message });

  const { id, name } = parsed.data;
  if (await nameTaken(name, id)) back(PATH, { error: `Jenis "${name}" sudah ada.` });

  await db.update(eventTypes).set({ name }).where(eq(eventTypes.id, id));
  await logAudit(me.id, "type.update", id, { name });

  back(PATH, { ok: `Jenis ${name} disimpan.` });
}

export async function setTypeActive(formData: FormData) {
  const me = await requireRole(["owner"]);

  const parsed = z
    .object({ id: z.string().min(1), active: z.enum(["0", "1"]) })
    .safeParse({ id: formData.get("id"), active: formData.get("active") });
  if (!parsed.success) back(PATH, { error: "Data tidak valid." });

  const { id, active } = parsed.data;
  await db.update(eventTypes).set({ active: Number(active) }).where(eq(eventTypes.id, id));
  await logAudit(me.id, active === "1" ? "type.activate" : "type.deactivate", id);

  back(PATH, { ok: active === "1" ? "Jenis diaktifkan." : "Jenis dinonaktifkan." });
}

export async function deleteType(formData: FormData) {
  const me = await requireRole(["owner"]);

  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) back(PATH, { error: "Data tidak valid." });

  const [current] = await db.select().from(eventTypes).where(eq(eventTypes.id, id.data)).limit(1);
  if (!current) back(PATH, { error: "Jenis tidak ditemukan." });

  if ((await eventCount(id.data)) > 0) {
    back(PATH, { error: "Jenis ini dipakai acara, jadi tidak bisa dihapus. Nonaktifkan saja." });
  }

  await db.delete(eventTypes).where(eq(eventTypes.id, id.data));
  await logAudit(me.id, "type.delete", id.data, { name: current.name });

  back(PATH, { ok: `Jenis ${current.name} dihapus.` });
}
