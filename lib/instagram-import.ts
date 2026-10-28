// Parsing + safety rules for the Apify Instagram import (M5). No network calls here.

/** Only these image hosts may be previewed in the form or fetched by Cloudinary. */
const IMAGE_HOST_SUFFIXES = ["cdninstagram.com", "fbcdn.net", "apifyusercontent.com", "apify.com"];

export const MAX_IMPORT_IMAGES = 10;

export function isAllowedImageUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return IMAGE_HOST_SUFFIXES.some((s) => host === s || host.endsWith("." + s));
  } catch {
    return false;
  }
}

export type ImportedPost = { caption: string; images: string[] };

function urlOf(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    for (const k of ["displayUrl", "url", "src"]) {
      if (typeof o[k] === "string") return o[k] as string;
    }
  }
  return null;
}

function collect(list: unknown): string[] {
  return Array.isArray(list) ? list.map(urlOf).filter((x): x is string => !!x) : [];
}

/** Turns one Apify dataset item into caption + ordered image URLs (carousel slides first). */
export function parseApifyItem(item: unknown): ImportedPost | null {
  if (!item || typeof item !== "object") return null;
  const it = item as Record<string, unknown>;

  let urls = collect(it.childPosts);
  if (urls.length === 0) urls = collect(it.images);
  if (urls.length === 0) {
    const single = urlOf(it.displayUrl);
    if (single) urls = [single];
  }

  const seen = new Set<string>();
  const images = urls
    .filter((u) => isAllowedImageUrl(u))
    .filter((u) => (seen.has(u) ? false : (seen.add(u), true)))
    .slice(0, MAX_IMPORT_IMAGES);

  const caption = typeof it.caption === "string" ? it.caption.trim().slice(0, 5000) : "";
  if (images.length === 0 && !caption) return null;
  return { caption, images };
}
