import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ownerMessages } from "@/db/schema";
import { Notice } from "@/components/Notice";
import { requireRole } from "@/lib/guard";
import {
  BODY_MAX,
  BODY_MIN,
  KIND_LABEL,
  SENT_STATUS_LABEL,
} from "@/lib/messages";
import { formatDbTime } from "@/lib/reports";
import {
  badge,
  badgeOff,
  btn,
  eyebrow,
  field,
  inputFull,
  pageTitle,
  sectionTitle,
} from "@/lib/ui";
import { sendMessage } from "./actions";
import { ResizableTextarea } from "@/components/ResizableTextarea";

export const metadata = { title: "Pesan ke owner | coscheck" };

export default async function MessagePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const me = await requireRole();
  const { error, ok } = await searchParams;

  const sent = await db
    .select()
    .from(ownerMessages)
    .where(eq(ownerMessages.fromUser, me.id))
    .orderBy(desc(ownerMessages.createdAt))
    .limit(20);

  return (
    <>
      <p className={eyebrow}>Panel admin</p>
      <h1 className={pageTitle}>
        PESAN KE <span className="text-accent">OWNER.</span>
      </h1>
      <p className="mt-4 max-w-[560px] text-sm leading-[1.7] text-muted">
        Butuh kota atau jenis acara baru? Kirim sebagai permintaan, karena hanya
        owner yang bisa menambahkannya. Bug dan saran juga boleh.
      </p>

      <Notice error={error} ok={ok} />

      <form
        action={sendMessage}
        className="mt-6 grid max-w-xl gap-3 border border-ink bg-card p-4"
      >
        <label className={field}>
          Jenis pesan
          <select name="kind" required defaultValue="" className={inputFull}>
            <option value="" disabled>
              Pilih jenis
            </option>
            <option value="request">{KIND_LABEL.request}</option>
            <option value="bug">{KIND_LABEL.bug}</option>
            <option value="suggestion">{KIND_LABEL.suggestion}</option>
          </select>
        </label>
        <label className={field}>
          Isi pesan
          <label className={field}>
            Isi pesan
            <ResizableTextarea
              name="body"
              required
              minLength={BODY_MIN}
              maxLength={BODY_MAX}
              rows={5}
              placeholder="Contoh: tolong tambahkan kota Palembang (WIB)."
            />
          </label>
        </label>
        <div>
          <button type="submit" className={btn}>
            Kirim pesan
          </button>
        </div>
      </form>

      <h2 className={sectionTitle}>Pesan yang sudah kamu kirim</h2>
      <ul className="grid gap-2.5">
        {sent.length === 0 && (
          <li className="border border-dashed border-line p-4 text-xs text-muted">
            Belum ada pesan.
          </li>
        )}
        {sent.map((m) => (
          <li key={m.id} className="border border-ink bg-card p-3.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={badge}>{KIND_LABEL[m.kind]}</span>
              <span className={badgeOff}>{SENT_STATUS_LABEL[m.status]}</span>
              <span className="font-mono text-[10px] text-muted">
                {formatDbTime(m.createdAt)}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-line text-xs leading-normal">
              {m.body}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
