"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { events, reports } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { back } from "@/lib/flash";
import { requireRole } from "@/lib/guard";

const NEXT = "/admin/reports";

/** Selesaikan semua laporan terbuka untuk satu acara. Opsional: sekalian tandai acara dibatalkan. */
export async function resolveReports(formData: FormData) {
  const me = await requireRole();

  const parsed = z
    .object({ eventId: z.string().min(1), cancel: z.literal("1").optional() })
    .safeParse({ eventId: formData.get("eventId"), cancel: formData.get("cancel") ?? undefined });
  if (!parsed.success) back(NEXT, { error: "Data tidak valid." });
  const { eventId, cancel } = parsed.data;

  const [ev] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!ev) back(NEXT, { error: "Acara tidak ditemukan." });

  const resolved = await db
    .update(reports)
    .set({ status: "resolved", resolvedBy: me.id })
    .where(and(eq(reports.eventId, eventId), eq(reports.status, "open")))
    .returning({ id: reports.id });
  if (resolved.length === 0) back(NEXT, { error: "Laporan untuk acara ini sudah diselesaikan." });

  let cancelled = false;
  if (cancel && ev.isCancelled !== 1 && ev.status !== "archived") {
    await db
      .update(events)
      .set({ isCancelled: 1, updatedBy: me.id, updatedAt: sql`(datetime('now'))` })
      .where(eq(events.id, ev.id));
    await logAudit(me.id, "event.cancel", ev.id, { title: ev.title, via: "report" });
    cancelled = true;
  }
  await logAudit(me.id, "report.resolve", ev.id, { title: ev.title, count: resolved.length, cancelled });

  revalidatePath("/admin", "layout");
  back(NEXT, {
    ok: cancelled
      ? `${resolved.length} laporan diselesaikan dan acara ditandai dibatalkan.`
      : `${resolved.length} laporan diselesaikan.`,
  });
}
