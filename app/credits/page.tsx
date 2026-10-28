import type { Metadata } from "next";
import { shell } from "@/lib/ui";
import { PersonCard, FeaturedSponsor } from "@/components/PersonCard";
import TeamSection from "@/components/TeamSection";
import {
  members,
  memberGroups,
  sponsors,
  specials,
  tools,
  fonts,
} from "@/lib/credits";

export const metadata: Metadata = { title: "Kredit | coscheck" };

const card =
  "border border-ink bg-card p-5 shadow-[3px_3px_0_var(--color-ink)]";
const grid = "grid gap-4 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]";

function Section({
  title,
  id,
  count,
  className = "",
  children,
}: {
  title: string;
  id?: string;
  count?: number;
  className?: string;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section id={id} className={`${card} ${className}`}>
      <h2 className="flex items-baseline gap-2 font-display text-lg font-bold uppercase">
        {title}
        {count !== undefined && (
          <span className="font-mono text-xs font-normal text-muted">
            {count}
          </span>
        )}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Tile({ name, note }: { name: string; note?: string }) {
  return (
    <li className="border border-ink bg-bg p-3">
      <p className="text-sm font-bold">{name}</p>
      {note && <p className="mt-0.5 text-xs text-soft">{note}</p>}
    </li>
  );
}

export default function CreditsPage() {
  // only ONE featured sponsor: the first with tier "utama".
  // any other "utama" falls back to a regular card.
  const featured = sponsors.find((s) => s.tier === "utama");
  const regular = sponsors.filter((s) => s !== featured);

  return (
    <main className={`${shell} py-10 sm:py-14`}>
      <p className="font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
        Kredit
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight sm:text-5xl">
        Dibuat dengan <span className="text-accent">bantuan</span>
      </h1>

      <nav className="mt-6 flex flex-wrap gap-2 font-mono text-xs uppercase">
        {[
          ["tim", "Tim"],
          ["sponsor", "Sponsor"],
          ["thanks", "Special Thanks"],
          ["teknologi", "Teknologi"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="border border-ink px-2.5 py-1 transition hover:bg-ink hover:text-paper"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-6 grid gap-6">
        <Section id="tim" title="Tim" count={members.length}>
          <TeamSection members={members} groups={memberGroups} />
        </Section>

        <Section id="sponsor" title="Sponsor" count={sponsors.length}>
          {featured && (
            <ul className="grid gap-4">
              <FeaturedSponsor p={featured} />
            </ul>
          )}
          {regular.length > 0 && (
            <ul className={`${grid} ${featured ? "mt-4" : ""}`}>
              {regular.map((s) => (
                <PersonCard key={s.name} p={s} />
              ))}
            </ul>
          )}
        </Section>

        <Section id="thanks" title="Special Thanks" count={specials.length}>
          <ul className="flex flex-wrap gap-2">
            {specials.map(([n, note]) => (
              <li key={n} className="border border-ink bg-bg px-3 py-1.5 text-sm">
                <strong>{n}</strong>
                <span className="text-soft"> · {note}</span>
              </li>
            ))}
          </ul>
        </Section>

        <div id="teknologi" className="grid gap-6 lg:grid-cols-3">
          <Section title="Teknologi" count={tools.length} className="lg:col-span-2">
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
              {tools.map(([name, note]) => (
                <Tile key={name} name={name} note={note} />
              ))}
            </ul>
          </Section>

          <Section title="Font" count={fonts.length}>
            <ul className="flex flex-wrap gap-2">
              {fonts.map((f) => (
                <li
                  key={f}
                  className="border border-ink bg-bg px-3 py-1.5 text-sm"
                  style={{ fontFamily: `"${f}", sans-serif` }}
                >
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-soft">
              Google Fonts · lisensi SIL Open Font
            </p>
          </Section>
        </div>
      </div>

      <p className="mt-8 border border-dashed border-ink p-4 text-sm leading-relaxed text-soft">
        <strong className="text-ink">Info acara:</strong> semua info acara,
        poster, dan foto adalah milik penyelenggaranya. Setiap acara punya
        tombol &quot;Postingan asli&quot; yang mengarah ke unggahan
        Instagram-nya. Selalu cek ulang ke akun penyelenggara sebelum berangkat.
      </p>
    </main>
  );
}