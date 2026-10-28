import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cities, eventTypes } from "@/db/schema";
import { EventForm } from "@/components/EventForm";
import { requireRole } from "@/lib/guard";
import { TZ_LABEL } from "@/lib/tz";
import { eyebrow, pageTitle } from "@/lib/ui";

export const metadata = { title: "Acara baru | coscheck" };
export const maxDuration = 60;

export default async function NewEventPage() {
  await requireRole();

  const [cityList, typeList] = await Promise.all([
    db.select().from(cities).where(eq(cities.active, 1)).orderBy(asc(cities.name)),
    db.select().from(eventTypes).where(eq(eventTypes.active, 1)).orderBy(asc(eventTypes.name)),
  ]);

  return (
    <>
      <p className={eyebrow}>Acara</p>
      <h1 className={`${pageTitle} mb-6`}>
        ACARA <span className="text-accent">BARU.</span>
      </h1>

      {cityList.length === 0 ? (
        <p className="border border-dashed border-line p-4 text-sm text-muted">
          Belum ada kota aktif. Minta owner menambahkan kota dulu di menu Kota.
        </p>
      ) : (
        <EventForm
          initial={{
            id: "", title: "", description: "", typeId: "", cityId: "",
            start: "", end: "", venueName: "", mapsUrl: "", organizer: "",
            sourceUrl: "", ticketMode: "tba",
          }}
          tickets={[]}
          images={[]}
          cities={cityList.map((c) => ({ id: c.id, name: c.name, label: TZ_LABEL[c.timezone] }))}
          types={typeList.map((t) => ({ id: t.id, name: t.name }))}
        />
      )}
    </>
  );
}
