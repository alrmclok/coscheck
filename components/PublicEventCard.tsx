import Link from "next/link";
import { cldUrl } from "@/lib/cloudinary-url";
import { dateTicket, formatWhen, ticketSummary, verificationInfo } from "@/lib/public-format";
import type { PublicEventListItem } from "@/lib/public-events";

export default function PublicEventCard({ e }: { e: PublicEventListItem }) {
  const ticket = dateTicket(e.startAt, e.timezone);
  const v = verificationInfo(e.lastVerifiedAt);
  const place = [e.venueName, e.cityName].filter(Boolean).join(", ");

  return (
    <Link
      href={`/events/${e.slug}`}
      className="group block border border-ink bg-card shadow-[3px_3px_0_var(--color-ink)] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-ink)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-ink bg-sand">
        {e.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cldUrl(e.coverUrl, "c_fill,g_auto,w_640,h_400,f_auto,q_auto")}
            alt={e.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute left-3 top-3 -rotate-3 border border-ink bg-card px-2.5 py-1 text-center shadow-[2px_2px_0_var(--color-ink)]">
          <div className="font-display text-xl font-bold leading-none">{ticket.day}</div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-accent">{ticket.month}</div>
        </div>
        {e.typeName && (
          <span className="absolute right-3 top-3 border border-ink bg-ink px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-paper">
            {e.typeName}
          </span>
        )}
        {e.isCancelled && (
          <span className="absolute bottom-3 left-3 border border-ink bg-accent px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-white">
            Dibatalkan
          </span>
        )}
      </div>

      <div className="space-y-1.5 p-4">
        <h3 className="font-display text-lg font-bold leading-snug">{e.title}</h3>
        <p className="text-sm text-[#6e675e]">{place}</p>
        <p className="font-mono text-xs text-[#6e675e]">{formatWhen(e.startAt, e.endAt, e.timezone)}</p>
        <div className="flex items-center justify-between gap-2 pt-2">
          <span className="font-mono text-sm font-medium">{ticketSummary(e.ticketMode, e.ticketCount, e.minPrice)}</span>
          <span
            className={
              v.fresh
                ? "font-mono text-[11px] font-medium text-[#57734c]"
                : "font-mono text-[11px] font-medium text-[#9a6a22]"
            }
          >
            {v.fresh ? "✓ " : ""}
            {v.label}
          </span>
        </div>
        {v.checked && <p className={v.fresh ? "font-mono text-[11px] text-muted" : "font-mono text-[11px] text-muted opacity-60"}>{v.checked}</p>}
      </div>
    </Link>
  );
}
