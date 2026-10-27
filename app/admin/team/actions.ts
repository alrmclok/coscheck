"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { back } from "@/lib/flash";
import { requireRole } from "@/lib/guard";

const PATH = "/admin/team";

const addSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  name: z.string().trim().max(80).optional(),
});

export async function addAdmin(formData: FormData) {
  const me = await requireRole(["owner"]);

  const parsed = addSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") || undefined,
  });
  if (!parsed.success) back(PATH, { error: "Format email tidak valid." });

  const { email, name } = parsed.data;

  if (email === process.env.OWNER_EMAIL?.toLowerCase()) {
    back(PATH, { error: "Email itu milik owner." });
  }

  const [existing] = await db
    .select({ active: users.active })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    back(PATH, {
      error: existing.active
        ? "Email itu sudah terdaftar sebagai admin."
        : "Email itu sudah terdaftar tapi nonaktif. Aktifkan lewat daftar di bawah.",
    });
  }

  const id = crypto.randomUUID();
  await db.insert(users).values({ id, email, name: name ?? null, role: "admin" });
  await logAudit(me.id, "admin.add", id, { email });

  back(PATH, { ok: `${email} ditambahkan sebagai admin.` });
}

const toggleSchema = z.object({
  id: z.string().min(1),
  active: z.enum(["0", "1"]),
});

export async function setAdminActive(formData: FormData) {
  const me = await requireRole(["owner"]);

  const parsed = toggleSchema.safeParse({
    id: formData.get("id"),
    active: formData.get("active"),
  });
  if (!parsed.success) back(PATH, { error: "Data tidak valid." });

  const { id, active } = parsed.data;

  const [target] = await db
    .select({ email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!target) back(PATH, { error: "Admin tidak ditemukan." });
  if (target.role === "owner") back(PATH, { error: "Owner tidak bisa dinonaktifkan." });

  await db
    .update(users)
    .set({ active: Number(active) })
    .where(eq(users.id, id));
  await logAudit(me.id, active === "1" ? "admin.reactivate" : "admin.deactivate", id, {
    email: target.email,
  });

  back(PATH, {
    ok: `${target.email} ${active === "1" ? "diaktifkan lagi" : "dinonaktifkan"}.`,
  });
}
