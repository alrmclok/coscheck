import type { Metadata } from "next";
import { shell } from "@/lib/ui";
import MemberPhoto from "@/components/MemberPhoto";

export const metadata: Metadata = { title: "Kredit | coscheck" };

const members: { name: string; role: string; photo?: string; link?: string }[] =
  [
    {
      name: "alrmclok",
      role: "Creator / Owner",
      photo: "https://res-console.cloudinary.com/re8qzxdm/thumbnails/v1/image/upload/v1793185480/ZmFudHViZQ==/preview",
      link: "https://instagram.com/alrmclok",
    },
    {
      name: "levtofer",
      role: "Co-owner",
      photo: "",
      link: "https://instagram.com/levtofer",
    },
  ];

const sponsors: { name: string; role: string; photo?: string; link?: string }[] =
  [
    {
      name: "Bandung Anime Event",
      role: "Sponsor Utama",
      photo: "https://res-console.cloudinary.com/re8qzxdm/thumbnails/v1/image/upload/v1793185479/bG9nby1iYWU=/preview",
      link: "https://instagram.com/bdg.anime.event",
    },
  ];

const tools = [
  ["Next.js & React", "kerangka aplikasi"],
  ["Tailwind CSS", "tampilan"],
  ["Turso & Drizzle ORM", "database"],
  ["Cloudinary", "hosting dan optimasi gambar"],
  ["Auth.js", "login Google untuk admin"],
  ["Apify", "ambil data postingan Instagram"],
  ["dnd-kit", "geser urutan gambar"],
  ["Lucide", "ikon"],
];

const specials = [
  ["9 Trio", "barudak"],
  ["Tailwind CSS", "tampilan"],
];

const fonts = ["DM Sans", "Space Grotesk", "DM Mono"];

export default function CreditsPage() {
  return (
    <main className={`${shell} py-10 sm:py-14`}>
      <p className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
        Kredit
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight sm:text-5xl">
        Dibuat dengan <span className="text-accent">bantuan</span>
      </h1>

      <section className="mt-8 border border-ink bg-card p-5 shadow-[3px_3px_0_var(--color-ink)]">
        <h2 className="font-display text-lg font-bold uppercase">Info acara</h2>
        <p className="mt-2 text-sm leading-relaxed text-soft">
          Semua info acara, poster, dan foto adalah milik penyelenggaranya.
          Setiap acara punya tombol &quot;Postingan asli&quot; yang mengarah ke
          unggahan Instagram-nya. Selalu cek ulang ke akun penyelenggara sebelum
          berangkat.
        </p>
      </section>

      <section className="mt-6 border border-ink bg-card p-5 shadow-[3px_3px_0_var(--color-ink)]">
        <h2 className="font-display text-lg font-bold uppercase">Tim</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {members.map((m) => (
            <li key={m.name} className="flex items-center gap-4">
              <MemberPhoto src={m.photo} alt={m.name} />
              <div className="min-w-0">
                <p className="font-bold">{m.name}</p>
                <p className="text-sm text-soft">{m.role}</p>
                {m.link && (
                  <a
                    href={m.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-accent underline underline-offset-4"
                  >
                    Profil
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 border border-ink bg-card p-5 shadow-[3px_3px_0_var(--color-ink)]">
        <h2 className="font-display text-lg font-bold uppercase">Sponsor</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {sponsors.map((s) => (
            <li key={s.name} className="flex items-center gap-4">
              <MemberPhoto src={s.photo} alt={s.name} />
              <div className="min-w-0">
                <p className="font-bold">{s.name}</p>
                <p className="text-sm text-soft">{s.role}</p>
                {s.link && (
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-accent underline underline-offset-4"
                  >
                    Profil
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 border border-ink bg-card p-5 shadow-[3px_3px_0_var(--color-ink)]">
        <h2 className="font-display text-lg font-bold uppercase">Teknologi</h2>
        <ul className="mt-3 space-y-1.5 text-sm">
          {tools.map(([name, note]) => (
            <li key={name}>
              <strong>{name}</strong>
              <span className="text-soft"> · {note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 border border-ink bg-card p-5 shadow-[3px_3px_0_var(--color-ink)]">
        <h2 className="font-display text-lg font-bold uppercase">Font</h2>
        <p className="mt-2 text-sm text-soft">
          {fonts.join(", ")}, lewat Google Fonts (lisensi SIL Open Font).
        </p>
      </section>

      <section className="mt-6 border border-ink bg-card p-5 shadow-[3px_3px_0_var(--color-ink)]">
        <h2 className="font-display text-lg font-bold uppercase">Special Thanks</h2>
        <ul className="mt-3 space-y-1.5 text-sm">
          {specials.map(([name, note]) => (
            <li key={name}>
              <strong>{name}</strong>
              <span className="text-soft"> · {note}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
