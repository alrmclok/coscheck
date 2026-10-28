import Link from "next/link";
import { shell, eyebrow, btnGhost } from "@/lib/ui";

// 1. DYNAMIC LIST: Tambah/kurang tim dengan gampang di sini
interface CreditItem {
  name: string;
  role: "Owner" | "Admin" | "Kontributor" | "Developer";
  isYou?: boolean;
  contribution?: string;
}

const CREDIT_ITEMS: CreditItem[] = [
  { name: "Nama Anda Sendiri", role: "Owner", isYou: true, contribution: "Ide proyek & Desain UI" },
  { name: "Andi Wijaya", role: "Admin", contribution: "Manajemen data & Moderator acara" },
  { name: "Siti Rahma", role: "Developer", contribution: "Integrasi API & Backend" },
  { name: "Budi Santoso", role: "Kontributor", contribution: "Penyedia data Event Surabaya" },
];

export default function CreditsPage() {
  // Mengelompokkan berdasarkan peran jika ingin diurutkan
  const sortedCredits = [...CREDIT_ITEMS].sort((a, b) => {
    if (a.role === "Owner") return -1;
    if (b.role === "Owner") return 1;
    return 0;
  });

  return (
    <div className={`${shell} py-10`}>
      {/* Tombol kembali ke Beranda */}
      <div className="mb-6">
        <Link href="/" className={`${btnGhost} text-xs font-mono uppercase tracking-wider`}>
          ← Kembali ke Beranda
        </Link>
      </div>

      <header className="mb-10 border-b border-ink pb-6">
        <p className={eyebrow}>Di balik layar aplikasi</p>
        <h1 className="font-display text-4xl font-bold uppercase leading-tight sm:text-5xl">
          Kredit & <span className="text-accent">Kontributor</span>
        </h1>
        <p className="mt-2 text-sm text-muted">
          Aplikasi ini dibangun dan dikelola oleh orang-orang hebat di bawah ini.
        </p>
      </header>

      {/* 2. BEDA LAYOUT: Layout List Baris Minimalis */}
      <div className="border border-ink bg-card divide-y divide-ink">
        {/* Header List */}
        <div className="hidden grid-cols-3 bg-ink px-6 py-3 font-mono text-xs uppercase tracking-wider text-paper sm:grid">
          <div>Nama</div>
          <div>Peran</div>
          <div>Kontribusi</div>
        </div>

        {/* Baris Kontributor */}
        {sortedCredits.map((item, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-1 gap-1 px-6 py-4 text-sm sm:grid-cols-3 sm:gap-4 sm:items-center ${
              item.isYou ? "bg-sand/40" : "hover:bg-sand/20"
            }`}
          >
            {/* Kolom Nama */}
            <div className="font-bold sm:font-normal flex items-center gap-2">
              <span>{item.name}</span>
              {item.isYou && (
                <span className="bg-ink px-1.5 py-0.5 font-mono text-[10px] uppercase text-paper tracking-wide">
                  Anda
                </span>
              )}
            </div>

            {/* Kolom Peran / Label */}
            <div>
              <span className={`inline-block font-mono text-xs uppercase px-2 py-0.5 border ${
                item.role === "Owner" ? "border-accent bg-accent/10 text-accent font-bold" :
                item.role === "Admin" ? "border-ink bg-ink text-paper" : "border-line text-muted"
              }`}>
                {item.role === "Owner" ? "Pemilik" : item.role === "Admin" ? "Pengelola" : item.role}
              </span>
            </div>

            {/* Kolom Detail Kontribusi */}
            <div className="text-xs text-muted sm:text-sm">
              <span className="sm:hidden font-medium text-ink block mt-1">Kontribusi:</span>
              {item.contribution || "-"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
