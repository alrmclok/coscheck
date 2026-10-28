"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { NOTE_MAX, REPORT_REASONS } from "@/lib/reports";
import { ResizableTextarea } from "@/components/ResizableTextarea";
import { btn, btnGhost, field, inputFull } from "@/lib/ui";

export default function ReportForm({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  async function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!reason) {
      setError("Pilih alasannya dulu.");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, reason, note }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (res.ok && data?.ok) {
        setStatus("done");
        return;
      }
      setError(data?.error ?? "Laporan gagal dikirim. Coba lagi.");
    } catch {
      setError("Tidak bisa terhubung. Cek koneksimu lalu coba lagi.");
    }
    setStatus("idle");
  }

  if (status === "done") {
    return (
      <p role="status" className="mt-3 text-sm font-bold">
        Terima kasih, laporanmu sudah masuk. Admin akan mengeceknya.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${btnGhost} mt-3`}
      >
        <Flag size={16} /> Laporkan masalah
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-3 grid gap-3 border border-ink bg-card p-3"
    >
      <label className={field}>
        Apa yang salah?
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={inputFull}
        >
          <option value="">Pilih alasan</option>
          {REPORT_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <label className={field}>
        Catatan (boleh dikosongkan)
        <ResizableTextarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={NOTE_MAX}
          rows={3}
          placeholder="Contoh: di postingan terbaru, acaranya pindah ke hari Minggu."
        />
        <span className="font-mono text-[10px] font-normal text-muted">
          {note.length}/{NOTE_MAX}
        </span>
      </label>
      {error && (
        <p role="alert" className="text-xs font-bold text-accent">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={status === "sending"}
          className={`${btn} disabled:opacity-60`}
        >
          {status === "sending" ? "Mengirim..." : "Kirim laporan"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={btnGhost}
        >
          Batal
        </button>
      </div>
    </form>
  );
}
