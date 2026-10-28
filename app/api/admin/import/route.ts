import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { events } from "@/db/schema";
import { getCurrentUser } from "@/lib/guard";
import { logAudit } from "@/lib/audit";
import { normalizeInstagramUrl } from "@/lib/instagram";
import { ApifyError, fetchInstagramPost } from "@/lib/apify";
import { checkImportCap, IMPORT_ACTION } from "@/lib/import-cap";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  url: z.string().trim().min(1).max(300),
  eventId: z.string().max(100).optional(),
});

function fail(error: string, status: number, extra?: object) {
  return NextResponse.json({ error, ...extra }, { status });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "owner")) return fail("Tidak diizinkan.", 401);

  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return fail("Link Instagram wajib diisi.", 400);

  const postUrl = normalizeInstagramUrl(body.data.url);
  if (!postUrl) return fail("Itu bukan link postingan Instagram yang valid.", 400);

  // Don't spend an Apify run on a post that already has an event.
  const [existing] = await db
    .select({ id: events.id, title: events.title })
    .from(events)
        .where(
      body.data.eventId
        ? and(eq(events.sourceUrl, postUrl), ne(events.id, body.data.eventId))
        : eq(events.sourceUrl, postUrl),
    )
    .limit(1);
  if (existing) return fail(`Postingan ini sudah dipakai oleh acara "${existing.title}".`, 409, { existing });

  const cap = await checkImportCap(user.id);
  if (!cap.ok) return fail(cap.message, 429);

  // Log BEFORE calling Apify: failed runs still cost money, so they count toward the cap.
  await logAudit(user.id, IMPORT_ACTION, postUrl);

  try {
    const post = await fetchInstagramPost(postUrl);
    return NextResponse.json({ sourceUrl: postUrl, caption: post.caption, images: post.images });
  } catch (e) {
    if (e instanceof ApifyError) return fail(e.message, e.status);
    console.error("[import]", e);
    return fail("Terjadi kesalahan saat impor.", 500);
  }
}
