// Client-safe formatting helpers for the public pages (M4).
const TZ_LABEL: Record<string, string> = {
  "Asia/Jakarta": "WIB",
  "Asia/Makassar": "WITA",
  "Asia/Jayapura": "WIT",
};

export function tzLabel(tz: string): string {
  return TZ_LABEL[tz] ?? tz;
}

function fmt(iso: string, tz: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: tz, ...opts }).format(new Date(iso));
}

function dayKey(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

const TIME: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" };
const DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

/** Day number + short month for the rotated date ticket. */
export function dateTicket(startIso: string, tz: string): { day: string; month: string } {
  return {
    day: fmt(startIso, tz, { day: "numeric" }),
    month: fmt(startIso, tz, { month: "short" }).toUpperCase(),
  };
}

/** "31 Okt 2026, 14.00–20.00 WIB" or a multi-day variant. */
export function formatWhen(startIso: string, endIso: string, tz: string): string {
  const label = tzLabel(tz);
  const d = (iso: string) => fmt(iso, tz, DATE);
  const t = (iso: string) => fmt(iso, tz, TIME);
  if (dayKey(startIso, tz) === dayKey(endIso, tz)) {
    return `${d(startIso)}, ${t(startIso)}–${t(endIso)} ${label}`;
  }
  return `${d(startIso)}, ${t(startIso)} – ${d(endIso)}, ${t(endIso)} ${label}`;
}

/** "24 Okt 2026" (shown in WIB; it is only a "checked on" date). */
export function formatCheckedDate(iso: string): string {
  return fmt(iso, "Asia/Jakarta", DATE);
}

export function isStale(iso: string, days = 14): boolean {
  return Date.now() - Date.parse(iso) > days * 24 * 60 * 60 * 1000;
}

export function verificationInfo(lastVerifiedAt: string | null): {
  fresh: boolean;
  label: string;
  checked: string | null;
} {
  if (!lastVerifiedAt) return { fresh: false, label: "Belum dicek ulang", checked: null };
  const fresh = !isStale(lastVerifiedAt, 14);
  return {
    fresh,
    label: fresh ? "Terverifikasi" : "Belum dicek ulang",
    checked: `Dicek: ${formatCheckedDate(lastVerifiedAt)}`,
  };
}

export function formatRupiah(n: number): string {
  return "Rp" + new Intl.NumberFormat("id-ID").format(n);
}

export function ticketSummary(mode: string, count: number, minPrice: number | null): string {
  if (mode === "free") return "Gratis";
  if (mode === "tba") return "TBA";
  if (minPrice == null || count === 0) return "Berbayar";
  return count > 1 ? `Mulai ${formatRupiah(minPrice)}` : formatRupiah(minPrice);
}

/** Only allow http(s) links in href attributes. */
export function safeHttp(url: string | null | undefined): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null;
}
