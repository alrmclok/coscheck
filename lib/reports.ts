// Konstanta dan helper kecil untuk laporan. Aman dipakai di client maupun server.
export const REASON_VALUES = ["wrong_date", "wrong_venue", "wrong_price", "cancelled", "other"] as const;
export type ReportReason = (typeof REASON_VALUES)[number];

export const REASON_LABEL: Record<ReportReason, string> = {
  wrong_date: "Tanggal atau jam salah",
  wrong_venue: "Lokasi salah",
  wrong_price: "Harga tiket salah",
  cancelled: "Acara dibatalkan",
  other: "Lainnya",
};

export const REPORT_REASONS = REASON_VALUES.map((value) => ({ value, label: REASON_LABEL[value] }));

export const NOTE_MAX = 300;
export const REPORT_LIMIT_PER_IP = 5; // per jam
export const REPORT_LIMIT_GLOBAL = 60; // per jam, semua IP

/** created_at dari database ("YYYY-MM-DD HH:MM:SS", UTC) -> teks WIB. */
export function formatDbTime(s: string): string {
  const d = new Date(s.includes("T") ? s : `${s.replace(" ", "T")}Z`);
  if (Number.isNaN(d.getTime())) return s;
  const text = d.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${text} WIB`;
}
