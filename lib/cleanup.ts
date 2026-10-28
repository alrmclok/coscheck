// Logika pembersihan harian (M7). Tidak memanggil Cloudinary langsung: semua lewat `CloudOps`,
// supaya bisa diuji dengan tiruan. Adapter asli ada di lib/cloudinary-cleanup.ts.
import { asc, eq, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import { eventImages, eventTickets, events, reports } from "@/db/schema";

export type PendingImage = { publicId: string; createdAt: string };

export interface CloudOps {
  /** Semua gambar Cloudinary yang masih bertag "pending". */
  listPending(): Promise<PendingImage[]>;
  destroy(ids: string[]): Promise<{ failed: string[] }>;
  untag(ids: string[]): Promise<void>;
}

export type CleanupOptions = {
  now?: Date;
  dryRun?: boolean;
  /** Maksimal acara yang diproses per jalan; sisanya menunggu jalan berikutnya. */
  maxEvents?: number;
  /** Waktu (epoch ms) setelah itu tidak mulai pekerjaan baru. */
  deadline?: number;
};

export type CleanupReport = {
  dryRun: boolean;
  cutoff: string;
  events: {
    found: number;
    deleted: number;
    more: boolean;
    timedOut: boolean;
    failed: { id: string; title: string; reason: string }[];
  };
  pending: {
    listed: number;
    stale: number;
    deleted: number;
    untagged: number;
    failed: number;
    error?: string;
  };
};

export const EVENT_RETENTION_MONTHS = 2;
export const PENDING_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const EVENT_FOLDER = "coscheck/events/";

/** Mundur n bulan kalender (UTC). Tanggal 31 dipotong ke akhir bulan tujuan (31 Mar -> 31 Jan, 30 Apr -> 28 Feb). */
export function monthsAgo(from: Date, n: number): Date {
  const d = new Date(from.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

const errText = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 200);

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function runCleanup(ops: CloudOps, opts: CleanupOptions = {}): Promise<CleanupReport> {
  const now = opts.now ?? new Date();
  const dryRun = opts.dryRun ?? false;
  const maxEvents = opts.maxEvents ?? 50;
  const deadline = opts.deadline ?? Number.POSITIVE_INFINITY;
  const cutoff = monthsAgo(now, EVENT_RETENTION_MONTHS).toISOString();

  const report: CleanupReport = {
    dryRun,
    cutoff,
    events: { found: 0, deleted: 0, more: false, timedOut: false, failed: [] },
    pending: { listed: 0, stale: 0, deleted: 0, untagged: 0, failed: 0 },
  };

  // ---------- 1. Acara yang sudah lewat 2 bulan (semua status) ----------
  const old = await db
    .select({ id: events.id, title: events.title })
    .from(events)
    .where(lt(events.endAt, cutoff))
    .orderBy(asc(events.endAt))
    .limit(maxEvents);
  report.events.found = old.length;
  report.events.more = old.length === maxEvents;

  for (const ev of old) {
    if (Date.now() > deadline) {
      report.events.timedOut = true;
      break;
    }
    try {
      const imgs = await db
        .select({ cloudinaryId: eventImages.cloudinaryId })
        .from(eventImages)
        .where(eq(eventImages.eventId, ev.id));

      if (dryRun) {
        report.events.deleted++; // = "akan dihapus"
        continue;
      }

      // Cloudinary dulu. Kalau ada yang gagal, baris database dipertahankan dan dicoba lagi besok.
      if (imgs.length) {
        const { failed } = await ops.destroy(imgs.map((i) => i.cloudinaryId));
        if (failed.length) {
          report.events.failed.push({
            id: ev.id,
            title: ev.title,
            reason: `${failed.length} gambar gagal dihapus di Cloudinary`,
          });
          continue;
        }
      }

      await db.transaction(async (tx) => {
        await tx.delete(eventTickets).where(eq(eventTickets.eventId, ev.id));
        await tx.delete(eventImages).where(eq(eventImages.eventId, ev.id));
        await tx.delete(reports).where(eq(reports.eventId, ev.id));
        await tx.delete(events).where(eq(events.id, ev.id));
      });
      report.events.deleted++;
    } catch (e) {
      report.events.failed.push({ id: ev.id, title: ev.title, reason: errText(e) });
    }
  }

  // ---------- 2. Gambar "pending" yang sudah basi ----------
  if (Date.now() > deadline) return report;

  let listed: PendingImage[];
  try {
    listed = await ops.listPending();
  } catch (e) {
    report.pending.error = errText(e);
    return report;
  }
  report.pending.listed = listed.length;

  const cutoffMs = now.getTime() - PENDING_MAX_AGE_MS;
  const stale = listed.filter((p) => {
    const t = Date.parse(p.createdAt);
    // Hanya folder acara kita, dan hanya yang tanggalnya jelas
    return p.publicId.startsWith(EVENT_FOLDER) && Number.isFinite(t) && t < cutoffMs;
  });
  report.pending.stale = stale.length;
  if (stale.length === 0) return report;

  // Yang ternyata dipakai acara (tag pending tertinggal) tidak boleh dihapus
  const used = new Set<string>();
  for (const part of chunks(stale.map((s) => s.publicId), 200)) {
    const rows = await db
      .select({ cloudinaryId: eventImages.cloudinaryId })
      .from(eventImages)
      .where(inArray(eventImages.cloudinaryId, part));
    for (const r of rows) used.add(r.cloudinaryId);
  }
  const orphans = stale.filter((s) => !used.has(s.publicId)).map((s) => s.publicId);
  const stuck = [...used];

  if (dryRun) {
    report.pending.deleted = orphans.length; // = "akan dihapus"
    report.pending.untagged = stuck.length;
    return report;
  }

  // Gambar yang hidup tapi masih bertag pending: cukup cabut tag-nya
  if (stuck.length) {
    try {
      await ops.untag(stuck);
      report.pending.untagged = stuck.length;
    } catch (e) {
      report.pending.error = `gagal mencabut tag: ${errText(e)}`;
    }
  }

  for (const part of chunks(orphans, 50)) {
    if (Date.now() > deadline) break;
    try {
      const { failed } = await ops.destroy(part);
      report.pending.deleted += part.length - failed.length;
      report.pending.failed += failed.length;
    } catch (e) {
      report.pending.failed += part.length;
      report.pending.error = errText(e);
    }
  }
  return report;
}
