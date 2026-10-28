import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { ownerMessages, reports } from "@/db/schema";

export type NavCounts = { reports: number; inbox: number };

/** reports = jumlah acara yang punya laporan terbuka. inbox = pesan belum dibaca (hanya owner). */
export async function getNavCounts(isOwner: boolean): Promise<NavCounts> {
  const [r] = await db
    .select({ n: sql<number>`count(distinct ${reports.eventId})` })
    .from(reports)
    .where(eq(reports.status, "open"));

  let inbox = 0;
  if (isOwner) {
    const [m] = await db
      .select({ n: sql<number>`count(*)` })
      .from(ownerMessages)
      .where(eq(ownerMessages.status, "unread"));
    inbox = Number(m?.n ?? 0);
  }
  return { reports: Number(r?.n ?? 0), inbox };
}
