/**
 * Terima link postingan Instagram (/p/, /reel/, /tv/) dan rapikan jadi bentuk baku.
 * Return null kalau bukan link postingan Instagram.
 */
export function normalizeInstagramUrl(input: string): string | null {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;

  const host = u.hostname.toLowerCase();
  if (host !== "instagram.com" && host !== "www.instagram.com") return null;

  const m = /^\/(?:[A-Za-z0-9._]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)\/?$/.exec(u.pathname);
  if (!m) return null;

  const kind = m[1] === "p" ? "p" : m[1] === "tv" ? "tv" : "reel";
  return `https://www.instagram.com/${kind}/${m[2]}/`;
}
