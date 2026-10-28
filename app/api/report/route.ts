import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { events, reports } from "@/db/schema";
import { clientIp, hashIp } from "@/lib/ip-hash";
import { NOTE_MAX, REASON_VALUES, REPORT_LIMIT_GLOBAL, REPORT_LIMIT_PER_IP } from "@/lib/reports";

export const dynamic = "force-dynamic";

const Body = z.object({
  slug: z.string().min(1).max(200),
  reason: z.enum(REASON_VALUES),
  note: z.string().max(NOTE_MAX).optional(),
});

const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

const DUPLICATE = "Kamu sudah melapor, tunggu admin mengeceknya.";

function isUniqueViolation(e: unknown): boolean {
  let cur: unknown = e;
  for (let i = 0; i < 4 && cur; i++) {
    const msg = cur instanceof Error ? cur.message : String(cur);
    if (/UNIQUE constraint failed/i.test(msg)) return true;
    cur = (cur as { cause?: unknown }).cause;
  }
  return false;
}

const lastHour = sql`datetime('now','-1 hour')`;

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail("Data tidak valid.", 400);
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return fail("Data tidak valid. Pilih alasan, dan catatan maksimal 300 huruf.", 400);
  const { slug, reason } = parsed.data;
  const note = parsed.data.note?.trim() || null;

  const ipHash = hashIp(clientIp(req.headers));
  if (!ipHash) {
    console.error("IP_HASH_SALT belum diisi, laporan ditolak.");
    return fail("Laporan belum bisa dikirim. Coba lagi nanti.", 500);
  }

  // Hanya acara yang terbit yang bisa dilaporkan
  const [ev] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.status, "published")))
    .limit(1);
  if (!ev) return fail("Acara tidak ditemukan.", 404);

  // Sudah ada laporan terbuka dari IP ini untuk acara ini?
  const [dupe] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(and(eq(reports.eventId, ev.id), eq(reports.ipHash, ipHash), eq(reports.status, "open")))
    .limit(1);
  if (dupe) return fail(DUPLICATE, 409);

  // Batas laporan: dihitung dari tabel reports (memori serverless tidak dibagi antar instance)
  const [[perIp], [overall]] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)` })
      .from(reports)
      .where(and(eq(reports.ipHash, ipHash), sql`${reports.createdAt} >= ${lastHour}`)),
    db
      .select({ n: sql<number>`count(*)` })
      .from(reports)
      .where(sql`${reports.createdAt} >= ${lastHour}`),
  ]);
  if (Number(perIp?.n ?? 0) >= REPORT_LIMIT_PER_IP || Number(overall?.n ?? 0) >= REPORT_LIMIT_GLOBAL) {
    return fail("Terlalu banyak laporan dalam satu jam terakhir. Coba lagi nanti.", 429);
  }

  try {
    await db.insert(reports).values({ eventId: ev.id, reason, note, ipHash });
  } catch (e) {
    // Dua permintaan bersamaan: uniq_open_report menang
    if (isUniqueViolation(e)) return fail(DUPLICATE, 409);
    throw e;
  }
  return NextResponse.json({ ok: true });
}
