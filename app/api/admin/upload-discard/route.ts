import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { eventImages } from "@/db/schema";
import { PUBLIC_ID_PATTERN, destroyImages } from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/guard";

const bodySchema = z.object({ cloudinaryId: z.string().regex(PUBLIC_ID_PATTERN) });

/** Buang gambar yang baru diupload tapi tidak jadi dipakai (belum disimpan ke acara mana pun). */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });

  const { cloudinaryId } = parsed.data;

  const [used] = await db
    .select({ id: eventImages.id })
    .from(eventImages)
    .where(eq(eventImages.cloudinaryId, cloudinaryId))
    .limit(1);
  if (used) return NextResponse.json({ error: "Gambar ini dipakai acara." }, { status: 409 });

  const { failed } = await destroyImages([cloudinaryId]);
  return NextResponse.json({ ok: failed.length === 0 });
}
