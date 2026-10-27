import {
  ArrowDownWideNarrow,
  CalendarDays,
  ChevronDown,
  MapPin,
  Search,
  Shapes,
  ShieldCheck,
} from "lucide-react";
import { EventCard, type EventCardData } from "@/components/EventCard";
import { eyebrow, shell } from "@/lib/ui";

// Data contoh untuk tampilan awal. Diganti data dari database di M4.
const events: EventCardData[] = [
  {
    day: "31",
    month: "OKT",
    title: "Bandung Halloween Cosplay Meet",
    category: "MEETUP",
    city: "Bandung",
    venue: "Braga CityWalk",
    time: "14.00–20.00 WIB",
    price: "Gratis",
    verified: true,
    verifiedOn: "24 Okt 2026",
    image:
      "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=800&q=80",
    color: "#e8b9a6",
  },
  {
    day: "02",
    month: "NOV",
    title: "Comifuro Mini Gathering",
    category: "KONVENSI",
    city: "Jakarta",
    venue: "SMESCO Convention Hall",
    time: "10.00–18.00 WIB",
    price: "Mulai Rp35.000",
    verified: true,
    verifiedOn: "24 Okt 2026",
    image:
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=800&q=80",
    color: "#c4c7b1",
  },
  {
    day: "08",
    month: "NOV",
    title: "Cosplay Street Photography",
    category: "FOTO BARENG",
    city: "Yogyakarta",
    venue: "Taman Sari",
    time: "08.00–12.00 WIB",
    price: "Rp15.000",
    verified: true,
    verifiedOn: "24 Okt 2026",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
    color: "#e5c7a2",
  },
  {
    day: "15",
    month: "NOV",
    title: "Nusantara Cosplay Championship",
    category: "KOMPETISI",
    city: "Surabaya",
    venue: "Grand City Convention",
    time: "11.00–19.00 WIB",
    price: "Mulai Rp50.000",
    verified: true,
    verifiedOn: "24 Okt 2026",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    color: "#b9c9d1",
  },
  {
    day: "22",
    month: "NOV",
    title: "Sunday Anime & Cosplay Day",
    category: "MEETUP",
    city: "Bandung",
    venue: "23 Paskal Shopping Center",
    time: "12.00–17.00 WIB",
    price: "Gratis",
    verified: false,
    verifiedOn: "24 Okt 2026",
    image:
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80",
    color: "#d7c3d7",
  },
  {
    day: "29",
    month: "NOV",
    title: "Cosplay Portrait Session",
    category: "FOTO BARENG",
    city: "Jakarta",
    venue: "Kota Tua",
    time: "09.00–13.00 WIB",
    price: "TBA",
    verified: true,
    verifiedOn: "24 Okt 2026",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    color: "#d8c5a9",
  },
];

const filterBase =
  "flex items-center gap-2 border px-[11px] py-2 text-xs font-semibold";

export default function HomePage() {
  return (
    <>
      <section
        className={`${shell} grid grid-cols-1 items-end gap-5 border-b border-ink pb-[29px] pt-8 sm:grid-cols-[1fr_170px] sm:gap-[30px] sm:pt-[42px] md:grid-cols-[1fr_245px]`}
      >
        <div>
          <p className={eyebrow}>Info acara cosplay Indonesia</p>
          <h1 className="max-w-[720px] font-display text-[49px] font-bold uppercase leading-[.98] tracking-[-2.7px] sm:text-[clamp(42px,6.3vw,76px)] sm:tracking-[-4px]">
            CARI EVENT
            <br />
            <span className="italic text-accent">COSPLAY</span> TERDEKAT.
          </h1>
          <p className="mt-[18px] max-w-[540px] text-[13px] leading-[1.7] text-[#655e54] sm:text-sm">
            Dari konvensi besar sampai foto bareng komunitas, semuanya ada di
            satu tempat. Tanggal, lokasi, dan harga tiket dicek rutin, jadi
            kamu tidak perlu scroll puluhan postingan Instagram.
          </p>
        </div>

        <aside className="hidden rotate-2 border border-accent p-[13px] text-accent sm:block md:p-[18px]">
          <div className="font-mono text-[10px] tracking-[1px]">
            CATAT TANGGALNYA
          </div>
          <div className="my-[5px] font-display text-[38px] font-bold leading-none md:text-5xl">
            2026
          </div>
          <div className="text-[11px] font-bold">AGENDA COSPLAY LOKAL</div>
        </aside>
      </section>

      <section className={shell}>
        <div className="flex flex-wrap items-center gap-2 border-b border-line py-[19px]">
          <span className="mr-2 w-full font-mono text-[11px] tracking-[.7px] sm:w-auto">
            FILTER /
          </span>
          <div className={`${filterBase} border-ink bg-ink text-paper`}>
            <CalendarDays size={14} aria-hidden="true" />
            Semua tanggal
            <ChevronDown size={13} aria-hidden="true" />
          </div>
          <div className={`${filterBase} border-line bg-card`}>
            <MapPin size={14} aria-hidden="true" />
            Semua kota
            <ChevronDown size={13} aria-hidden="true" />
          </div>
          <div className={`${filterBase} border-line bg-card`}>
            <Shapes size={14} aria-hidden="true" />
            Semua jenis
            <ChevronDown size={13} aria-hidden="true" />
          </div>
          <div className="flex min-w-full items-center gap-2 border border-line bg-card px-[11px] py-2 text-xs text-muted md:ml-auto md:min-w-[210px]">
            <Search size={15} aria-hidden="true" />
            Cari nama acara...
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 pb-4 pt-[27px]">
          <div>
            <h2 className="font-display text-[23px] font-bold tracking-[-.8px] sm:text-[25px]">
              ACARA <span className="text-accent">MENDATANG.</span>
            </h2>
            <p className="mt-[5px] text-xs text-muted">
              Acara cosplay dari berbagai kota di Indonesia.
            </p>
          </div>
          <div className="flex items-center gap-[7px] font-mono text-[9px] uppercase sm:text-[10px]">
            <ArrowDownWideNarrow size={14} aria-hidden="true" />
            Terdekat dulu
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pb-[38px] sm:gap-4 md:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.title} event={event} />
          ))}
        </div>

        <aside className="mb-[42px] flex items-start gap-2.5 border border-ink bg-trust p-3 sm:items-center sm:gap-3.5 sm:px-[18px] sm:py-[17px]">
          <div className="grid size-9 shrink-0 place-items-center bg-accent text-white">
            <ShieldCheck size={20} aria-hidden="true" />
          </div>
          <div>
            <strong className="block font-display text-[13px]">
              Cek tanggal verifikasinya sebelum berangkat.
            </strong>
            <p className="mt-1 text-[11px] leading-normal text-[#6e675e]">
              Jadwal dan harga bisa berubah sewaktu-waktu. Kalau ragu, pastikan
              lagi lewat akun resmi penyelenggara.
            </p>
          </div>
          <div className="ml-auto hidden whitespace-nowrap text-right font-mono text-[10px] text-accent sm:block">
            CEK DULU
            <br />
            BARU BERANGKAT
          </div>
        </aside>
      </section>
    </>
  );
}
