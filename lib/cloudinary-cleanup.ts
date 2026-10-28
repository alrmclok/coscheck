// Adapter Cloudinary asli untuk lib/cleanup.ts. SERVER ONLY.
// `@/lib/cloudinary` mengatur konfigurasi SDK saat di-import, jadi `cloudinary.api` di bawah sudah terkonfigurasi.
import { v2 as cloudinary } from "cloudinary";
import { destroyImages, untagPending } from "@/lib/cloudinary";
import type { CloudOps, PendingImage } from "@/lib/cleanup";

const MAX_PAGES = 10; // 10 x 500 = 5000 gambar pending per jalan, lebih dari cukup

export const cloudinaryOps: CloudOps = {
  async listPending() {
    const out: PendingImage[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await cloudinary.api.resources_by_tag("pending", {
        resource_type: "image",
        max_results: 500,
        next_cursor: cursor,
      });
      for (const r of res.resources ?? []) out.push({ publicId: r.public_id, createdAt: r.created_at });
      cursor = res.next_cursor;
      if (!cursor) break;
    }
    return out;
  },

  async destroy(ids) {
    const { failed } = await destroyImages(ids);
    return { failed: failed.map(String) };
  },

  async untag(ids) {
    await untagPending(ids);
  },
};
