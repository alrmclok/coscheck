import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import ReportForm from "@/components/ReportForm";
import Gallery from "@/components/Gallery";
import { cldUrl } from "@/lib/cloudinary-url";
import { getPublicEvent } from "@/lib/public-events";
import { formatRupiah, formatWhen, safeHttp, ticketSummary, verificationInfo } from "@/lib/public-format";
import { btn, btnGhost, eyebrow, shell } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const e = await getPublicEvent(slug);
  if (!e) return { title: "Acara tidak ditemukan" };

  const where = [e.venueName, e.cityName].filter(Boolean).join(", ");
  const description = [e.isCancelled ? "DIBATALKAN" : null, formatWhen(e.startAt, e.endAt, e.timezone), where]
    .filter(Boolean)
    .join(" · ");
  const title = `${e.title} | coscheck`;
  // f_jpg keeps the preview image simple for WhatsApp / Discord crawlers
  const og = e.images[0] ? cldUrl(e.images[0].url, "c_fill,g_auto,w_1200,h_630,f_jpg,q_auto") : undefined;

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "id_ID",
      siteName: "coscheck",
      images: og ? [{ url: og, width: 1200, height: 630, alt: e.title }] : undefined,
    },
    twitter: {
      card: og ? "summary_large_image" : "summary",
      title,
      description,
      images: og ? [og] : undefined,
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const e = await getPublicEvent(slug);
  if (!e) notFound();

  const v = verificationInfo(e.lastVerifiedAt);
  const when = formatWhen(e.startAt, e.endAt, e.timezone);
  const maps = safeHttp(e.mapsUrl);
  const source = safeHttp(e.sourceUrl);
  const over = Date.parse(e.endAt) < Date.now();

  return (
    <div className={`${shell} py-8`}>
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider hover:text-accent">
        <ArrowLeft size={14} /> Semua acara
      </Link>

      {e.isCancelled && (
        <div className="mb-6 border border-ink bg-accent px-4 py-3 font-display font-bold uppercase tracking-wide text-white">
          Acara ini dibatalkan
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        {/* Gallery */}
        <Gallery images={e.images} title={e.title} />

        {/* Info */}
        <div className="space-y-6">
          <div>
            {e.typeName && <p className={eyebrow}>{e.typeName}</p>}
            <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{e.title}</h1>
            {over && <p className="mt-2 font-mono text-xs text-muted">Acara ini sudah selesai.</p>}
          </div>

          <dl className="space-y-4 border border-ink bg-card p-5 shadow-[3px_3px_0_var(--color-ink)]">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-muted">Kapan</dt>
              <dd className="mt-0.5 font-medium">{when}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-muted">Di mana</dt>
              <dd className="mt-0.5 font-medium">{[e.venueName, e.cityName].filter(Boolean).join(", ")}</dd>
              {maps && (
                <a href={maps} target="_blank" rel="noopener noreferrer" className={`${btnGhost} mt-2`}>
                  <MapPin size={16} /> Buka di Maps
                </a>
              )}
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-muted">Tiket</dt>
              <dd className="mt-0.5">
                {e.ticketMode === "paid" && e.tickets.length > 0 ? (
                  <ul className="space-y-2">
                    {e.tickets.map((t, i) => {
                      const link = safeHttp(t.url);
                      return (
                        <li key={i} className="flex flex-wrap items-center justify-between gap-2">
                          <span>
                            {t.name ? <span className="mr-2">{t.name}</span> : null}
                            <span className="font-mono font-medium">{formatRupiah(t.priceIdr)}</span>
                          </span>
                          {link && (
                            <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-xs underline hover:text-accent">
                              Info tiket <ExternalLink size={12} />
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <span className="font-mono font-medium">{ticketSummary(e.ticketMode, e.tickets.length, null)}</span>
                )}
              </dd>
            </div>
            {e.organizer && (
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted">Penyelenggara</dt>
                <dd className="mt-0.5 font-medium">{e.organizer}</dd>
              </div>
            )}
          </dl>

          <div className="flex flex-wrap gap-2">
            {source && (
              <a href={source} target="_blank" rel="noopener noreferrer" className={btn}>
                <ExternalLink size={16} /> Postingan asli
              </a>
            )}
            <ShareButton title={e.title} text={`${e.title} — ${when}`} />
          </div>

          <div className="border border-line bg-trust p-4">
            <p className={v.fresh ? "font-mono text-sm font-medium text-[#57734c]" : "font-mono text-sm font-medium text-[#9a6a22]"}>
              {v.fresh ? "✓ " : ""}
              {v.label}
            </p>
            {v.checked && <p className={v.fresh ? "font-mono text-xs text-muted" : "font-mono text-xs text-muted opacity-60"}>{v.checked}</p>}
            <p className="mt-2 text-sm">Cek tanggal verifikasinya sebelum berangkat.</p>
            <ReportForm slug={e.slug} />
          </div>
        </div>
      </div>

      {e.description && (
        <section className="mt-10 max-w-3xl">
          <h2 className="mb-2 font-display text-xl font-bold uppercase">Deskripsi</h2>
          <p className="whitespace-pre-line leading-relaxed">{e.description}</p>
        </section>
      )}
    </div>
  );
}
