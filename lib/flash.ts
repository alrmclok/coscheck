import { redirect } from "next/navigation";

/** Kembali ke halaman dengan pesan sukses atau error di URL. */
export function back(path: string, flash: { error?: string; ok?: string }): never {
  const q = new URLSearchParams();
  if (flash.error) q.set("error", flash.error);
  if (flash.ok) q.set("ok", flash.ok);
  redirect(`${path}?${q.toString()}`);
}
