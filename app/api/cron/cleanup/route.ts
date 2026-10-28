import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runCleanup } from "@/lib/cleanup";
import { cloudinaryOps } from "@/lib/cloudinary-cleanup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Vercel Cron mengirim "Authorization: Bearer <CRON_SECRET>". Dibandingkan lewat hash supaya panjangnya sama. */
function authorized(req: Request, secret: string): boolean {
  const a = createHash("sha256").update(req.headers.get("authorization") ?? "").digest();
  const b = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) {
    console.error("CRON_SECRET belum diisi atau kurang dari 16 karakter.");
    return NextResponse.json({ ok: false, error: "Cron belum dikonfigurasi." }, { status: 500 });
  }
  if (!authorized(req, secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // ?dry=1 -> hanya melaporkan apa yang akan dihapus
  const dryRun = new URL(req.url).searchParams.get("dry") === "1";
  const report = await runCleanup(cloudinaryOps, { dryRun, deadline: Date.now() + 50_000 });
  console.log("cleanup", JSON.stringify(report));
  return NextResponse.json({ ok: true, ...report });
}
