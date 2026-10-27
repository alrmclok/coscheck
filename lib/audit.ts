import { db } from "@/db";
import { auditLog } from "@/db/schema";

/** Catat aksi admin/owner. Dipanggil setelah setiap penulisan data. */
export async function logAudit(
  userId: string,
  action: string,
  targetId?: string | null,
  detail?: Record<string, unknown>,
) {
  await db.insert(auditLog).values({
    userId,
    action,
    targetId: targetId ?? null,
    detail: detail ? JSON.stringify(detail) : null,
  });
}
