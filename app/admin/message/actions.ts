"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { ownerMessages } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { back } from "@/lib/flash";
import { requireRole } from "@/lib/guard";
import { BODY_MAX, BODY_MIN, MESSAGE_KINDS } from "@/lib/messages";

const NEXT = "/admin/message";

export async function sendMessage(formData: FormData) {
  const me = await requireRole();

  const parsed = z
    .object({
      kind: z.enum(MESSAGE_KINDS),
      body: z.string().trim().min(BODY_MIN).max(BODY_MAX),
    })
    .safeParse({ kind: formData.get("kind"), body: formData.get("body") });
  if (!parsed.success) {
    back(NEXT, { error: `Pilih jenis pesan dan tulis isinya (${BODY_MIN} sampai ${BODY_MAX} huruf).` });
  }

  const [row] = await db
    .insert(ownerMessages)
    .values({ fromUser: me.id, kind: parsed.data.kind, body: parsed.data.body })
    .returning({ id: ownerMessages.id });
  await logAudit(me.id, "message.send", row.id, { kind: parsed.data.kind });

  revalidatePath("/admin", "layout");
  back(NEXT, { ok: "Pesan terkirim ke owner." });
}
