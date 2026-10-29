import Link from "next/link";
import { btn, btnGhost, eyebrow, shell } from "@/lib/ui";

export const metadata = {
  title: "Halaman tidak ditemukan",
};

export default function NotFound() {
  return (
    <div className={`${shell} py-10`}>
      <header className="mb-8">
        <p className={eyebrow}>Error 404</p>
        <h1 className="font-display text-4xl font-bold uppercase leading-tight sm:text-5xl">
          Halaman <span className="text-accent">tidak ketemu</span>
        </h1>
      </header>

      <div className="border border-dashed border-ink bg-card p-10 text-center">
        <p className="font-display text-lg font-bold">Waduh, kamu nyasar.</p>
        <p className="mt-1 text-sm text-muted">
          Halaman yang kamu cari tidak ada, sudah dipindah, atau acaranya sudah dihapus.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className={btn}>
            Lihat acara terdekat
          </Link>
          <Link href="/?tab=past" className={btnGhost}>
            Acara yang sudah lewat
          </Link>
        </div>
      </div>

      <p className="mt-10 border border-line bg-trust px-4 py-3 text-center font-mono text-xs">
        Cek lagi alamat URL-nya sebelum berangkat.
      </p>
    </div>
  );
}