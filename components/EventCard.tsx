import { BadgeCheck, CircleAlert, Clock3, MapPin } from "lucide-react";

export type EventCardData = {
  day: string;
  month: string;
  title: string;
  category: string;
  city: string;
  venue: string;
  time: string;
  price: string;
  verified: boolean;
  verifiedOn: string;
  image: string;
  color: string;
};

export function EventCard({ event }: { event: EventCardData }) {
  return (
    <article
      className="min-w-0 overflow-hidden border border-ink bg-card"
      style={{ "--poster-color": event.color } as React.CSSProperties}
    >
      <div className="relative h-[125px] overflow-hidden border-b border-ink bg-(--poster-color) after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(0deg,#17130d70,transparent_55%)] after:content-[''] sm:h-[155px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="block h-full w-full object-cover saturate-[.78]"
          src={event.image}
          alt={`Poster ${event.title}`}
        />
        <div className="absolute left-[7px] top-[7px] z-[1] flex h-[46px] w-[41px] -rotate-3 flex-col items-center justify-center border border-ink bg-paper sm:left-2.5 sm:top-2.5 sm:h-[53px] sm:w-12">
          <span className="font-display text-[21px] font-bold leading-none sm:text-2xl">
            {event.day}
          </span>
          <span className="mt-[3px] font-mono text-[10px] font-medium text-accent">
            {event.month}
          </span>
        </div>
        <span className="absolute right-[7px] top-[7px] z-[1] bg-accent p-1 font-mono text-[8px] tracking-[.4px] text-white sm:right-[9px] sm:top-2.5 sm:px-[7px] sm:py-[5px] sm:text-[9px]">
          {event.category}
        </span>
        <span className="absolute bottom-2.5 right-2.5 z-[1] font-mono text-[9px] tracking-[1px] text-white">
          COSCHECK / AGENDA
        </span>
      </div>

      <div className="p-2.5 sm:p-[13px]">
        <h3 className="font-display text-sm font-bold leading-[1.3] tracking-[-.35px] sm:min-h-[44px] sm:text-[17px]">
          {event.title}
        </h3>

        <div className="mt-[9px] flex items-start gap-1.5 text-[10px] leading-normal text-[#6e675e] sm:text-[11px]">
          <MapPin size={13} aria-hidden="true" className="mt-px shrink-0" />
          <span>
            {event.venue}, {event.city}
          </span>
        </div>

        <div className="mt-[9px] flex items-start gap-1.5 text-[10px] leading-normal text-[#6e675e] sm:text-[11px]">
          <Clock3 size={13} aria-hidden="true" className="mt-px shrink-0" />
          <span>{event.time}</span>
        </div>

        <div className="mt-3 flex flex-col items-start justify-between gap-1.5 border-t border-dashed border-line pt-2.5 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-[11px] font-extrabold sm:text-xs">
            {event.price}
          </span>
          <span
            className={`flex items-center gap-1 whitespace-nowrap text-[10px] font-bold ${
              event.verified ? "text-[#57734c]" : "text-[#9a6a22]"
            }`}
          >
            {event.verified ? (
              <BadgeCheck size={12} aria-hidden="true" />
            ) : (
              <CircleAlert size={12} aria-hidden="true" />
            )}
            {event.verified ? "Terverifikasi" : "Belum dicek ulang"}
          </span>
        </div>

        <div className="mt-2 font-mono text-[8px] text-[#91897e] sm:text-[9px]">
          Dicek: {event.verifiedOn}
        </div>
      </div>
    </article>
  );
}
