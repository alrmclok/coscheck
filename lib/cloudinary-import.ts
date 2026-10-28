// SERVER ONLY. Used by saveEvent (next step) to let Cloudinary fetch an imported Instagram image by URL.
import { v2 as cloudinary } from "cloudinary";
import "@/lib/cloudinary"; // configures the SDK at import
import { isAllowedImageUrl } from "@/lib/instagram-import";

export async function uploadFromUrl(url: string) {
  if (!isAllowedImageUrl(url)) throw new Error("URL gambar tidak diizinkan.");
  const r = await cloudinary.uploader.upload(url, {
    folder: "coscheck/events",
    tags: ["pending"],
    allowed_formats: ["jpg", "png", "webp"],
    resource_type: "image",
  });
  return { cloudinaryId: r.public_id, url: r.secure_url, width: r.width as number, height: r.height as number };
}
