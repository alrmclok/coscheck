import { createHmac } from "node:crypto";

/** IP klien dari x-forwarded-for (nilai pertama). */
export function clientIp(headers: Headers): string {
  const first = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return first || headers.get("x-real-ip")?.trim() || "unknown";
}

/** HMAC-SHA256 dengan IP_HASH_SALT. Null kalau salt belum diisi. IP asli tidak disimpan. */
export function hashIp(ip: string): string | null {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) return null;
  return createHmac("sha256", salt).update(ip).digest("hex");
}
