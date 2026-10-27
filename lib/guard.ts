import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

export type Role = "admin" | "owner";

/**
 * Baca sesi, lalu cek ulang user di database.
 * Admin yang dinonaktifkan langsung kehilangan akses.
 * Return null kalau belum login / tidak aktif (cocok untuk route API).
 */
export async function getCurrentUser() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user && user.active === 1 ? user : null;
}

/** Untuk halaman server: redirect kalau tidak boleh masuk. */
export async function requireRole(allowed: Role[] = ["admin", "owner"]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!allowed.includes(user.role)) redirect("/admin");
  return user;
}
