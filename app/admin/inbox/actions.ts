"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { ownerMessages } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/guard";

type Tab = "open" | "done" | "all";

/** Kembali ke kotak masuk dengan tab yang sama + pesan sukses/error. */
function go(tab: Tab, flash: { ok?: string; error?: string }): never {
  const q = new URLSearchParams();
  if (tab !== "open") q.set("tab", tab);
  if (flash.error) q.set("error", flash.error);
  if (flash.ok) q.set("ok", flash.ok);
  const s = q.toString();
  redirect(s ? `/admin/inbox?${s}` : "/admin/inbox");
}

export async function setMessageStatus(formData: FormData) {
  const me = await requireRole(["owner"]);
  const tab = z.enum(["open", "done", "all"]).catch("open").parse(formData.get("tab"));

  const parsed = z
    .object({ id: z.string().min(1), to: z.enum(["read", "done"]) })
    .safeParse({ id: formData.get("id"), to: formData.get("to") });
  if (!parsed.success) go(tab, { error: "Data tidak valid." });
  const { id, to } = parsed.data;

  const [msg] = await db.select().from(ownerMessages).where(eq(ownerMessages.id, id)).limit(1);
  if (!msg) go(tab, { error: "Pesan tidak ditemukan." });

  await db.update(ownerMessages).set({ status: to }).where(eq(ownerMessages.id, id));
  await logAudit(me.id, to === "done" ? "message.done" : "message.read", id, { kind: msg.kind });

  revalidatePath("/admin", "layout");
  go(tab, { ok: to === "done" ? "Pesan ditandai selesai." : "Pesan ditandai dibaca." });
}
