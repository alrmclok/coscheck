// Aman dipakai di client dan server (tidak mengimpor SDK).
export const THUMB = "c_fill,w_320,h_320,f_auto,q_auto";

/** Sisipkan transformasi Cloudinary ke URL gambar. */
export function cldUrl(url: string, transform = "f_auto,q_auto"): string {
  return url.replace("/image/upload/", `/image/upload/${transform}/`);
}
