import { z } from "zod";
import { normalizeInstagramUrl } from "./instagram";
import { TZ_LABEL, type Timezone } from "./tz";

// ---------- Waktu ----------

// Indonesia tidak pakai DST, jadi offset-nya tetap.
const OFFSET_HOURS: Record<Timezone, number> = {
  "Asia/Jakarta": 7,
  "Asia/Makassar": 8,
  "Asia/Jayapura": 9,
};

/** "2026-11-02T10:00" (jam lokal kota) -> ISO UTC */
export function localToUtcIso(local: string, tz: Timezone): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) throw new Error("Format waktu tidak valid");
  const [, y, mo, d, h, mi] = m.map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h, mi) - OFFSET_HOURS[tz] * 3_600_000).toISOString();
}

/** ISO UTC -> nilai untuk <input type="datetime-local"> di zona waktu kota */
export function utcIsoToLocalInput(iso: string, tz: Timezone): string {
  return new Date(Date.parse(iso) + OFFSET_HOURS[tz] * 3_600_000).toISOString().slice(0, 16);
}

export function formatEventDate(startIso: string, endIso: string, tz: Timezone): string {
  const date = new Intl.DateTimeFormat("id-ID", { timeZone: tz, day: "numeric", month: "short", year: "numeric" });
  const time = new Intl.DateTimeFormat("id-ID", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const s = new Date(startIso);
  const e = new Date(endIso);
  const label = TZ_LABEL[tz];

  if (date.format(s) === date.format(e)) {
    return `${date.format(s)}, ${time.format(s)}–${time.format(e)} ${label}`;
  }
  return `${date.format(s)} ${time.format(s)} – ${date.format(e)} ${time.format(e)} ${label}`;
}

export function formatShortDate(iso: string, tz: Timezone): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: tz, day: "numeric", month: "short" }).format(new Date(iso));
}

/** Stempel verifikasi dianggap pudar setelah 14 hari. */
export function isStale(iso: string, days = 14): boolean {
  return Date.now() - Date.parse(iso) > days * 86_400_000;
}

// ---------- Slug ----------

export function makeSlug(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return `${base || "acara"}-${crypto.randomUUID().slice(0, 4)}`;
}

// ---------- Aturan publish ----------

/** Acara hanya boleh terbit kalau punya minimal satu gambar (gambar pertama = cover). */
export const REQUIRE_COVER_TO_PUBLISH = true;

// ---------- Form ----------

export type TicketMode = "paid" | "free" | "tba";
export type TicketRow = { name: string; price: string; url: string };

export type SavedImage = {
  cloudinaryId: string;
  url: string;
  width: number | null;
  height: number | null;
};

export type EventFormValues = {
  id: string;
  title: string;
  description: string;
  typeId: string;
  cityId: string;
  start: string;
  end: string;
  venueName: string;
  mapsUrl: string;
  organizer: string;
  sourceUrl: string;
  ticketMode: TicketMode;
};

export type SaveState = { error?: string; values?: Partial<EventFormValues> };

function isMapsUrl(v: string): boolean {
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return /(^|\.)google\.[a-z.]+$/i.test(u.hostname) || /(^|\.)goo\.gl$/i.test(u.hostname);
  } catch {
    return false;
  }
}

function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

const dt = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Isi tanggal dan jam dengan lengkap.");

const eventSchema = z
  .object({
    title: z.string().min(3, "Judul minimal 3 karakter.").max(120, "Judul maksimal 120 karakter."),
    description: z.string().max(5000, "Deskripsi maksimal 5000 karakter."),
    typeId: z.string(),
    cityId: z.string().min(1, "Pilih kota."),
    start: dt,
    end: dt,
    venueName: z.string().max(120, "Nama tempat maksimal 120 karakter."),
    mapsUrl: z.string().refine((v) => !v || isMapsUrl(v), "Link Maps harus link Google Maps (google.com/maps atau maps.app.goo.gl)."),
    organizer: z.string().max(120, "Nama penyelenggara maksimal 120 karakter."),
    sourceUrl: z
      .string()
      .refine((v) => !v || normalizeInstagramUrl(v) !== null, "Link sumber harus postingan Instagram (instagram.com/p/... atau /reel/...)."),
    ticketMode: z.enum(["paid", "free", "tba"], "Pilih jenis tiket."),
  })
  .refine((v) => v.end >= v.start, { message: "Waktu selesai tidak boleh sebelum waktu mulai.", path: ["end"] });

export type ParsedTicket = { name: string | null; priceIdr: number; url: string | null };

export type ParsedEvent = {
  images: SavedImage[];
  title: string;
  description: string | null;
  typeId: string | null;
  cityId: string;
  start: string;
  end: string;
  venueName: string | null;
  mapsUrl: string | null;
  organizer: string | null;
  sourceUrl: string | null;
  ticketMode: TicketMode;
  tickets: ParsedTicket[];
};

const FIELD_KEYS = [
  "title", "description", "typeId", "cityId", "start", "end",
  "venueName", "mapsUrl", "organizer", "sourceUrl", "ticketMode",
] as const;

export function parseEventForm(
  fd: FormData,
):
  | { ok: true; data: ParsedEvent }
  | { ok: false; error: string; values: Partial<EventFormValues> } {
  const values: Record<string, string> = {};
  for (const k of FIELD_KEYS) values[k] = String(fd.get(k) ?? "").trim();

  const parsed = eventSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, values };
  }
  const f = parsed.data;

  // Tiket
  const tickets: ParsedTicket[] = [];
  if (f.ticketMode === "paid") {
    const names = fd.getAll("ticketName").map((v) => String(v).trim());
    const prices = fd.getAll("ticketPrice").map((v) => String(v).trim());
    const urls = fd.getAll("ticketUrl").map((v) => String(v).trim());

    if (prices.length === 0) {
      return { ok: false, error: "Tambahkan minimal satu tiket berbayar.", values };
    }
    if (prices.length > 10) {
      return { ok: false, error: "Maksimal 10 tiket per acara.", values };
    }

    for (let i = 0; i < prices.length; i++) {
      const n = i + 1;
      const digits = prices[i].replace(/[^\d]/g, "");
      const price = digits ? Number(digits) : NaN;
      if (!Number.isInteger(price) || price < 1 || price > 100_000_000) {
        return { ok: false, error: `Harga tiket ${n} tidak valid. Isi dengan angka rupiah, mis. 35000.`, values };
      }
      if ((names[i] ?? "").length > 40) {
        return { ok: false, error: `Nama tiket ${n} maksimal 40 karakter.`, values };
      }
      if (urls[i] && !isHttpUrl(urls[i])) {
        return { ok: false, error: `Link tiket ${n} harus diawali http:// atau https://.`, values };
      }
      tickets.push({ name: names[i] || null, priceIdr: price, url: urls[i] || null });
    }
  }

  // Gambar: daftar berurutan (posisi 0 = cover), sudah diupload langsung ke Cloudinary oleh browser
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
  const imageSchema = z.object({
    cloudinaryId: z.string().regex(/^coscheck\/events\/[A-Za-z0-9_-]+$/),
    url: z.string().startsWith(`https://res.cloudinary.com/${cloud}/image/upload/`),
    width: z.number().int().positive().nullable(),
    height: z.number().int().positive().nullable(),
  });

  let images: SavedImage[] = [];
  try {
    images = z.array(imageSchema).max(10).parse(JSON.parse(String(fd.get("images") ?? "[]")));
  } catch {
    return { ok: false, error: "Daftar gambar tidak valid (maksimal 10). Muat ulang halaman lalu coba lagi.", values };
  }
  if (new Set(images.map((i) => i.cloudinaryId)).size !== images.length) {
    return { ok: false, error: "Ada gambar yang dobel di daftar.", values };
  }

  return {
    ok: true,
    data: {
      images,
      title: f.title,
      description: f.description || null,
      typeId: f.typeId || null,
      cityId: f.cityId,
      start: f.start,
      end: f.end,
      venueName: f.venueName || null,
      mapsUrl: f.mapsUrl || null,
      organizer: f.organizer || null,
      sourceUrl: f.sourceUrl ? normalizeInstagramUrl(f.sourceUrl) : null,
      ticketMode: f.ticketMode,
      tickets,
    },
  };
}
