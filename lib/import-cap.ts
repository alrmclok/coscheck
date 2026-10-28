// SERVER ONLY. Daily import cap, counted from audit_log rows (action 'import.fetch'). No extra table.
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLog } from "@/db/schema";

export const IMPORT_ACTION = "import.fetch";
const WIB_MS = 7 * 60 * 60 * 1000;

function envInt(name: string, fallback: number): number {
  const n = parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Start of today in WIB, as the SQLite 'YYYY-MM-DD HH:MM:SS' UTC string used by created_at. */
export function wibDayStart(now = new Date()): string {
  const wib = new Date(now.getTime() + WIB_MS);
  const start = Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()) - WIB_MS;
  return new Date(start).toISOString().slice(0, 19).replace("T", " ");
}

async function countToday(userId?: string): Promise<number> {
  const conds = [eq(auditLog.action, IMPORT_ACTION), gte(auditLog.createdAt, wibDayStart())];
  if (userId) conds.push(eq(auditLog.userId, userId));
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(auditLog).where(and(...conds));
  return Number(row?.n ?? 0);
}

export async function checkImportCap(userId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const globalCap = envInt("APIFY_DAILY_IMPORT_CAP", 20);
  const perAdminCap = envInt("APIFY_DAILY_IMPORT_CAP_PER_ADMIN", 10);
  const [mine, all] = await Promise.all([countToday(userId), countToday()]);
  if (mine >= perAdminCap) return { ok: false, message: `Batas impor harianmu (${perAdminCap}) sudah tercapai. Coba lagi besok.` };
  if (all >= globalCap) return { ok: false, message: `Batas impor harian (${globalCap}) sudah tercapai. Coba lagi besok.` };
  return { ok: true };
}
