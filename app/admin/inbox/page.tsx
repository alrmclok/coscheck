import Link from "next/link";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { ownerMessages, users } from "@/db/schema";
import { Notice } from "@/components/Notice";
import { requireRole } from "@/lib/guard";
import { INBOX_STATUS_LABEL, KIND_LABEL } from "@/lib/messages";
import { formatDbTime } from "@/lib/reports";
import { badge, badgeOff, btnGhost, eyebrow, pageTitle } from "@/lib/ui";
import { setMessageStatus } from "./actions";

export const metadata = { title: "Kotak masuk — coscheck" };

const TABS = [
  { key: "open", label: "Perlu ditangani" },
  { key: "done", label: "Selesai" },
  { key: "all", label: "Semua" },
] as const;

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; error?: string; ok?: string }>;
}) {
  await requireRole(["owner"]);
  const { tab: tabParam, error, ok } = await searchParams;
  const tab = TABS.find((t) => t.key === tabParam)?.key ?? "open";

  const [counts, rows] = await Promise.all([
    db
      .select({ status: ownerMessages.status, n: sql<number>`count(*)` })
      .from(ownerMessages)
      .groupBy(ownerMessages.status),
    db
      .select({
        id: ownerMessages.id,
        kind: ownerMessages.kind,
        body: ownerMessages.body,
        status: ownerMessages.status,
        createdAt: ownerMessages.createdAt,
        fromName: users.name,
        fromEmail: users.email,
      })
      .from(ownerMessages)
      .innerJoin(users, eq(ownerMessages.fromUser, users.id))
      .where(
        tab === "open"
          ? inArray(ownerMessages.status, ["unread", "read"])
          : tab === "done"
            ? eq(ownerMessages.status, "done")
            : undefined,
      )
      .orderBy(desc(ownerMessages.createdAt))
      .limit(100),
  ]);
  const unread = Number(counts.find((c) => c.status === "unread")?.n ?? 0);

  return (
    <>
      <p className={eyebrow}>Panel owner</p>
      <h1 className={pageTitle}>
        KOTAK <span className="text-accent">MASUK.</span>
      </h1>

      <Notice error={error} ok={ok} />

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filter pesan">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Link
              key={t.key}
              href={t.key === "open" ? "/admin/inbox" : `/admin/inbox?tab=${t.key}`}
              className={`border px-3 py-1.5 text-xs font-semibold ${active ? "border-ink bg-ink text-paper" : "border-line bg-card"}`}
            >
              {t.label}
              {t.key === "open" && unread > 0 ? ` (${unread} baru)` : ""}
            </Link>
          );
        })}
      </nav>

      <ul className="mt-5 grid gap-2.5">
        {rows.length === 0 && (
          <li className="border border-dashed border-line p-4 text-xs text-muted">Tidak ada pesan di sini.</li>
        )}
        {rows.map((m) => (
          <li key={m.id} className="border border-ink bg-card p-3.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={badge}>{KIND_LABEL[m.kind]}</span>
              {m.status === "unread" ? (
                <span className="bg-accent px-1.5 py-[3px] font-mono text-[9px] uppercase tracking-[.6px] text-white">
                  {INBOX_STATUS_LABEL.unread}
                </span>
              ) : (
                <span className={badgeOff}>{INBOX_STATUS_LABEL[m.status]}</span>
              )}
              <span className="text-xs font-bold">{m.fromName ?? m.fromEmail}</span>
              <span className="font-mono text-[10px] text-muted">{formatDbTime(m.createdAt)}</span>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm leading-normal">{m.body}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-line pt-3">
              {m.status === "unread" && (
                <form action={setMessageStatus}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="tab" value={tab} />
                  <input type="hidden" name="to" value="read" />
                  <button type="submit" className={btnGhost}>
                    Tandai dibaca
                  </button>
                </form>
              )}
              {m.status !== "done" ? (
                <form action={setMessageStatus}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="tab" value={tab} />
                  <input type="hidden" name="to" value="done" />
                  <button type="submit" className={btnGhost}>
                    Selesai
                  </button>
                </form>
              ) : (
                <form action={setMessageStatus}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="tab" value={tab} />
                  <input type="hidden" name="to" value="read" />
                  <button type="submit" className={btnGhost}>
                    Buka lagi
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
