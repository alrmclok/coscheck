"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useState } from "react";
import type { TicketMode, TicketRow } from "@/lib/events";
import { btnGhost, input } from "@/lib/ui";

const MODES: { value: TicketMode; label: string }[] = [
  { value: "paid", label: "Berbayar" },
  { value: "free", label: "Gratis" },
  { value: "tba", label: "TBA (belum diumumkan)" },
];

const EMPTY: TicketRow = { name: "", price: "", url: "" };

export function TicketFields({
  initialMode,
  initialTickets,
}: {
  initialMode: TicketMode;
  initialTickets: TicketRow[];
}) {
  const [mode, setMode] = useState<TicketMode>(initialMode);
  const [rows, setRows] = useState<TicketRow[]>(initialTickets.length ? initialTickets : [EMPTY]);

  const update = (i: number, patch: Partial<TicketRow>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const move = (i: number, dir: -1 | 1) =>
    setRows((r) => {
      const j = i + dir;
      if (j < 0 || j >= r.length) return r;
      const copy = [...r];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  return (
    <div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {MODES.map((m) => (
          <label key={m.value} className="flex cursor-pointer items-center gap-2 text-xs font-bold">
            <input
              type="radio"
              name="ticketMode"
              value={m.value}
              checked={mode === m.value}
              onChange={() => setMode(m.value)}
              className="accent-accent"
            />
            {m.label}
          </label>
        ))}
      </div>

      {mode === "paid" && (
        <div className="mt-4 grid gap-2.5">
          {rows.map((row, i) => (
            <div key={i} className="grid gap-2 border border-line bg-card p-3 sm:grid-cols-[1fr_150px_1fr_auto] sm:items-end">
              <label className="flex flex-col gap-1 text-[11px] font-bold">
                Nama tiket {rows.length > 1 ? "" : "(opsional)"}
                <input
                  name="ticketName"
                  value={row.name}
                  maxLength={40}
                  placeholder={rows.length > 1 ? "Presale 1, VIP, OTS" : "Kosongkan kalau cuma satu"}
                  onChange={(e) => update(i, { name: e.target.value })}
                  className={`${input} w-full`}
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-bold">
                Harga (Rp)
                <input
                  name="ticketPrice"
                  value={row.price}
                  inputMode="numeric"
                  placeholder="35000"
                  onChange={(e) => update(i, { price: e.target.value })}
                  className={`${input} w-full`}
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-bold">
                Link beli (opsional)
                <input
                  name="ticketUrl"
                  value={row.url}
                  placeholder="https://..."
                  onChange={(e) => update(i, { url: e.target.value })}
                  className={`${input} w-full`}
                />
              </label>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Naikkan tiket" className={`${btnGhost} px-2 disabled:opacity-30`}>
                  <ArrowUp size={14} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Turunkan tiket" className={`${btnGhost} px-2 disabled:opacity-30`}>
                  <ArrowDown size={14} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))} disabled={rows.length === 1} aria-label="Hapus tiket" className={`${btnGhost} px-2 disabled:opacity-30`}>
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}

          {rows.length < 10 && (
            <div>
              <button type="button" onClick={() => setRows((r) => [...r, EMPTY])} className={btnGhost}>
                <Plus size={14} aria-hidden="true" />
                Tambah tiket
              </button>
            </div>
          )}
        </div>
      )}

      {mode === "free" && <p className="mt-3 text-xs text-muted">Di halaman acara akan tampil “Gratis”.</p>}
      {mode === "tba" && <p className="mt-3 text-xs text-muted">Di halaman acara akan tampil “TBA”.</p>}
    </div>
  );
}
