import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const EVENT_FOLDER = "coscheck/events";
/** Gambar yang baru diupload diberi tag ini. Tag dicabut saat acara disimpan. */
export const PENDING_TAG = "pending";
export const ALLOWED_FORMATS = "jpg,png,webp";
export const PUBLIC_ID_PATTERN = /^coscheck\/events\/[A-Za-z0-9_-]+$/;

/** Tanda tangan supaya browser boleh upload langsung ke Cloudinary dengan aturan yang kita tentukan. */
export function signUpload() {
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    allowed_formats: ALLOWED_FORMATS,
    folder: EVENT_FOLDER,
    tags: PENDING_TAG,
    timestamp,
  };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);

  return {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    timestamp,
    signature,
    folder: EVENT_FOLDER,
    tags: PENDING_TAG,
    allowedFormats: ALLOWED_FORMATS,
  };
}

/** Hapus gambar dari Cloudinary. "not found" dianggap berhasil. */
export async function destroyImages(publicIds: string[]): Promise<{ failed: string[] }> {
  const results = await Promise.allSettled(
    publicIds.map((id) => cloudinary.uploader.destroy(id, { invalidate: true })),
  );
  const failed = publicIds.filter((_, i) => {
    const r = results[i];
    return r.status === "rejected" || !["ok", "not found"].includes(r.value.result);
  });
  return { failed };
}

/** Cabut tag pending dari gambar yang sudah dipakai acara. */
export async function untagPending(publicIds: string[]) {
  if (publicIds.length === 0) return;
  await cloudinary.uploader.remove_tag(PENDING_TAG, publicIds);
}
