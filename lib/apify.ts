// SERVER ONLY. Calls Apify synchronously for ONE Instagram post. Stores nothing.
import { parseApifyItem, type ImportedPost } from "@/lib/instagram-import";

export class ApifyError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

export async function fetchInstagramPost(postUrl: string): Promise<ImportedPost> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new ApifyError("Impor Instagram belum dikonfigurasi.", 503);

  const actor = (process.env.APIFY_ACTOR_ID || "apify/instagram-scraper").replace("/", "~");
  let res: Response;
  try {
    res = await fetch(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?timeout=55`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ directUrls: [postUrl], resultsType: "posts", resultsLimit: 1 }),
      signal: AbortSignal.timeout(58_000),
      cache: "no-store",
    });
  } catch {
    throw new ApifyError("Instagram terlalu lama merespons. Coba lagi sebentar lagi.", 504);
  }

  if (res.status === 402) throw new ApifyError("Kuota Apify habis. Kabari owner.", 503);
  if (!res.ok) throw new ApifyError("Gagal mengambil postingan dari Instagram.", 502);

  const data: unknown = await res.json().catch(() => null);
  const first = Array.isArray(data) ? data[0] : null;
  const post = parseApifyItem(first);
  if (!post) {
    console.error("[apify] unusable item, keys:", first && typeof first === "object" ? Object.keys(first) : first);
    throw new ApifyError("Postingan tidak ditemukan atau tidak bisa dibaca (mungkin akun privat).", 422);
  }
  return post;
}
