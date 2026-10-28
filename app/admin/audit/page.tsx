import Link from "next/link";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLog, users } from "@/db/schema";
import { requireRole } from "@/lib/guard";
import { formatDbTime } from "@/lib/reports";
import { badge, btnGhost, eyebrow, input, pageTitle } from "@/lib/ui";

export const metadata = { title: "Log audit | coscheck" };

const PAGE_SIZE = 50;

/** detail (JSON kecil) -> satu baris teks. */
function summarize(detail: string | null): string {
  if (!detail) return "";
  try {
    const obj: unknown = JSON.parse(detail);
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      return Object.entries(obj)
        .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
        .join(" · ")
        .slice(0, 160);
    }
  } catch {
    // bukan JSON: tampilkan apa adanya
  }
  return detail.slice(0, 160);
}

/** Link ke acara untuk aksi yang target-nya id acara. */
function targetHref(action: string, id: string | null): string | null {
  if (!id || action === "event.delete") return null;
  return action.startsWith("event.") || action === "report.resolve" ? `/admin/events/${id}` : null;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; user?: string; page?: string }>;
}) {
  await requireRole(["owner"]);
  const sp = await searchParams;
  const action = sp.action?.trim() || "";
  const user = sp.user?.trim() || "";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const conds = [];
  if (action) conds.push(eq(auditLog.action, action));
  if (user) conds.push(eq(auditLog.userId, user));

  const [actionRows, userRows, rowsPlusOne] = await Promise.all([
    db.selectDistinct({ action: auditLog.action }).from(auditLog).orderBy(asc(auditLog.action)),
    db.select({ id: users.id, name: users.name, email: users.email }).from(users).orderBy(asc(users.email)),
    db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        targetId: auditLog.targetId,
        detail: auditLog.detail,
        createdAt: auditLog.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLog)
      .innerJoin(users, eq(auditLog.userId, users.id))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(auditLog.createdAt), sql`audit_log.rowid desc`)
      .limit(PAGE_SIZE + 1)
      .offset((page - 1) * PAGE_SIZE),
  ]);
  const hasMore = rowsPlusOne.length > PAGE_SIZE;
  const rows = hasMore ? rowsPlusOne.slice(0, PAGE_SIZE) : rowsPlusOne;

  const href = (p: number) => {
    const q = new URLSearchParams();
    if (action) q.set("action", action);
    if (user) q.set("user", user);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/admin/audit?${s}` : "/admin/audit";
  };

  return (
    <>
      <p className={eyebrow}>Panel owner</p>
      <h1 className={pageTitle}>
        LOG <span className="text-accent">AUDIT.</span>
      </h1>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-[11px] font-bold">
          Aksi
          <select name="action" defaultValue={action} className={input}>
            <option value="">Semua aksi</option>
            {actionRows.map((a) => (
              <option key={a.action} value={a.action}>
                {a.action}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-bold">
          Pengguna
          <select name="user" defaultValue={user} className={input}>
            <option value="">Semua pengguna</option>
            {userRows.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? u.email}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={btnGhost}>
          Terapkan
        </button>
        {(action || user) && (
          <Link href="/admin/audit" className={btnGhost}>
            Reset
          </Link>
        )}
      </form>

      <ul className="mt-5 grid gap-2">
        {rows.length === 0 && (
          <li className="border border-dashed border-line p-4 text-xs text-muted">Belum ada catatan yang cocok.</li>
        )}
        {rows.map((r) => {
          const link = targetHref(r.action, r.targetId);
          const text = summarize(r.detail);
          return (
            <li key={r.id} className="border border-line bg-card p-3 text-xs leading-normal">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] text-muted">{formatDbTime(r.createdAt)}</span>
                <span className={badge}>{r.action}</span>
                <span className="font-bold">{r.userName ?? r.userEmail}</span>
              </div>
              {(text || link) && (
                <p className="mt-1 break-words text-muted">
                  {text}
                  {link && (
                    <>
                      {text ? " " : ""}
                      <Link href={link} className="font-bold text-ink underline underline-offset-2 hover:text-accent">
                        Buka acara
                      </Link>
                    </>
                  )}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {(page > 1 || hasMore) && (
        <div className="mt-5 flex items-center gap-3 text-xs">
          {page > 1 && (
            <Link href={href(page - 1)} className={btnGhost}>
              Sebelumnya
            </Link>
          )}
          <span className="font-mono text-muted">Halaman {page}</span>
          {hasMore && (
            <Link href={href(page + 1)} className={btnGhost}>
              Berikutnya
            </Link>
          )}
        </div>
      )}
    </>
  );
}
