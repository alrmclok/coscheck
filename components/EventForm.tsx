"use client";

import Link from "next/link";
import { startTransition, useActionState, useRef, useState } from "react";
import { saveEvent } from "@/app/admin/events/actions";
import type { EventFormValues, SaveState, SavedImage, TicketRow } from "@/lib/events";
import { btn, btnGhost, field, inputFull, sectionTitle } from "@/lib/ui";
import { ImageCarousel, type ImageCarouselHandle } from "./ImageCarousel";
import { TicketFields } from "./TicketFields";

export type CityOption = { id: string; name: string; label: string };
export type TypeOption = { id: string; name: string };

export function EventForm({
  initial,
  tickets,
  images,
  cities,
  types,
}: {
  initial: EventFormValues;
  tickets: TicketRow[];
  images: SavedImage[];
  cities: CityOption[];
  types: TypeOption[];
}) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(saveEvent, {});
  const carousel = useRef<ImageCarouselHandle>(null);
  const [uploading, setUploading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const v = { ...initial, ...(state.values ?? {}) };
  const isNew = !initial.id;

  // Gambar baru dikirim ke Cloudinary saat Simpan ditekan, baru setelah itu acara disimpan.
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setClientError(null);
    setUploading(true);
    try {
      const images = await carousel.current!.uploadAll();
      const fd = new FormData(formEl);
      fd.set("images", JSON.stringify(images));
      startTransition(() => formAction(fd));
    } catch (err) {
      setClientError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={initial.id} />

      {(clientError ?? state.error) && (
        <div role="alert" className="mb-4 border border-accent px-3 py-2.5 text-xs font-semibold text-accent">
          {clientError ?? state.error}
        </div>
      )}

      <h2 className={`${sectionTitle} mt-0`}>Info dasar</h2>
      <div className="grid gap-3.5">
        <label className={field}>
          Judul acara
          <input name="title" required maxLength={120} defaultValue={v.title} className={inputFull} />
        </label>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className={field}>
            Jenis acara
            <select name="typeId" defaultValue={v.typeId} className={inputFull}>
              <option value="">— Belum dipilih —</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className={field}>
            Penyelenggara
            <input name="organizer" maxLength={120} defaultValue={v.organizer} className={inputFull} />
          </label>
        </div>
        <label className={field}>
          Deskripsi
          <textarea name="description" rows={6} maxLength={5000} defaultValue={v.description} className={inputFull} />
        </label>
      </div>

      <h2 className={sectionTitle}>Gambar</h2>
      <ImageCarousel ref={carousel} initial={images} locked={uploading || pending} />

      <h2 className={sectionTitle}>Waktu dan tempat</h2>
      <div className="grid gap-3.5">
        <label className={`${field} sm:max-w-xs`}>
          Kota
          <select name="cityId" required defaultValue={v.cityId} className={inputFull}>
            <option value="" disabled>
              — Pilih kota —
            </option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.label})
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className={field}>
            Mulai
            <input type="datetime-local" name="start" required defaultValue={v.start} className={inputFull} />
          </label>
          <label className={field}>
            Selesai
            <input type="datetime-local" name="end" required defaultValue={v.end} className={inputFull} />
          </label>
        </div>
        <p className="-mt-1 text-[11px] text-muted">Jam diisi sesuai zona waktu kota yang dipilih (WIB, WITA, atau WIT).</p>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className={field}>
            Nama tempat
            <input name="venueName" maxLength={120} defaultValue={v.venueName} className={inputFull} />
          </label>
          <label className={field}>
            Link Google Maps
            <input name="mapsUrl" placeholder="https://maps.app.goo.gl/..." defaultValue={v.mapsUrl} className={inputFull} />
          </label>
        </div>
      </div>

      <h2 className={sectionTitle}>Tiket</h2>
      <TicketFields initialMode={v.ticketMode} initialTickets={tickets} />

      <h2 className={sectionTitle}>Sumber</h2>
      <label className={field}>
        Link postingan Instagram
        <input name="sourceUrl" placeholder="https://www.instagram.com/p/..." defaultValue={v.sourceUrl} className={inputFull} />
      </label>
      <p className="mt-1.5 text-[11px] text-muted">Dipakai untuk tombol “Postingan asli” di halaman acara dan mencegah acara ganda.</p>

      <div className="mt-8 flex flex-wrap gap-2.5">
        <button type="submit" disabled={pending || uploading} className={`${btn} disabled:opacity-60`}>
          {uploading ? "Mengupload gambar..." : pending ? "Menyimpan..." : isNew ? "Simpan sebagai draft" : "Simpan perubahan"}
        </button>
        <Link href="/admin/events" className={btnGhost}>
          Batal
        </Link>
      </div>
    </form>
  );
}
