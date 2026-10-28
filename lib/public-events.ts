// Server-only queries for the public pages (M4). Only `published` events are ever returned.
import { cache } from "react";
import { and, asc, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { cities, eventImages, eventTickets, eventTypes, events } from "@/db/schema";

export type Tab = "upcoming" | "past";
export const PAGE_SIZE = 24;
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export type PublicFilters = {
  tab: Tab;
  city?: string;
  type?: string;
  month?: string; // "YYYY-MM"
  q?: string;
  limit: number;
};

export type PublicEventListItem = {
  id: string;
  slug: string;
  title: string;
  startAt: string;
  endAt: string;
  timezone: string;
  venueName: string | null;
  ticketMode: string;
  isCancelled: boolean;
  lastVerifiedAt: string | null;
  cityName: string;
  typeName: string | null;
  coverUrl: string | null;
  ticketCount: number;
  minPrice: number | null;
};

function monthRange(month: string): { from: string; to: string } | null {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  return {
    from: new Date(Date.UTC(y, mo - 1, 1) - WIB_OFFSET_MS).toISOString(),
    to: new Date(Date.UTC(y, mo, 1) - WIB_OFFSET_MS).toISOString(),
  };
}

function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, "\\$&")}%`;
}

export async function getFilterOptions() {
  const [cityRows, typeRows] = await Promise.all([
    db.select({ id: cities.id, name: cities.name }).from(cities).where(eq(cities.active, 1)).orderBy(asc(cities.name)),
    db.select({ id: eventTypes.id, name: eventTypes.name }).from(eventTypes).where(eq(eventTypes.active, 1)).orderBy(asc(eventTypes.name)),
  ]);
  return { cities: cityRows, types: typeRows };
}

export async function getPublicEvents(f: PublicFilters): Promise<{ items: PublicEventListItem[]; hasMore: boolean }> {
  const now = new Date().toISOString();
  const conds = [
    eq(events.status, "published"),
    f.tab === "past" ? lt(events.endAt, now) : gte(events.endAt, now),
  ];
  if (f.city) conds.push(eq(events.cityId, f.city));
  if (f.type) conds.push(eq(events.typeId, f.type));
  const range = f.month ? monthRange(f.month) : null;
  if (range) conds.push(lt(events.startAt, range.to), gte(events.endAt, range.from));
  if (f.q) conds.push(sql`${events.title} LIKE ${likePattern(f.q)} ESCAPE '\\'`);

  const rows = await db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      startAt: events.startAt,
      endAt: events.endAt,
      timezone: events.timezone,
      venueName: events.venueName,
      ticketMode: events.ticketMode,
      isCancelled: events.isCancelled,
      lastVerifiedAt: events.lastVerifiedAt,
      cityName: cities.name,
      typeName: eventTypes.name,
    })
    .from(events)
    .innerJoin(cities, eq(cities.id, events.cityId))
    .leftJoin(eventTypes, eq(eventTypes.id, events.typeId))
    .where(and(...conds))
    .orderBy(f.tab === "past" ? desc(events.startAt) : asc(events.startAt))
    .limit(f.limit + 1);

  const hasMore = rows.length > f.limit;
  const page = hasMore ? rows.slice(0, f.limit) : rows;
  if (page.length === 0) return { items: [], hasMore: false };

  const ids = page.map((r) => r.id);
  const [covers, prices] = await Promise.all([
    db
      .select({ eventId: eventImages.eventId, url: eventImages.url })
      .from(eventImages)
      .where(and(inArray(eventImages.eventId, ids), eq(eventImages.position, 0))),
    db
      .select({
        eventId: eventTickets.eventId,
        minPrice: sql<number>`min(${eventTickets.priceIdr})`,
        count: sql<number>`count(*)`,
      })
      .from(eventTickets)
      .where(inArray(eventTickets.eventId, ids))
      .groupBy(eventTickets.eventId),
  ]);
  const coverBy = new Map(covers.map((c) => [c.eventId, c.url]));
  const priceBy = new Map(prices.map((p) => [p.eventId, p]));

  return {
    hasMore,
    items: page.map((r) => ({
      ...r,
      isCancelled: !!r.isCancelled,
      coverUrl: coverBy.get(r.id) ?? null,
      ticketCount: Number(priceBy.get(r.id)?.count ?? 0),
      minPrice: priceBy.get(r.id) ? Number(priceBy.get(r.id)!.minPrice) : null,
    })),
  };
}

/** One published event with images + tickets, or null (drafts/archived look like "not found"). */
export const getPublicEvent = cache(async (slug: string) => {
  const [row] = await db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      description: events.description,
      startAt: events.startAt,
      endAt: events.endAt,
      timezone: events.timezone,
      venueName: events.venueName,
      mapsUrl: events.mapsUrl,
      organizer: events.organizer,
      ticketMode: events.ticketMode,
      sourceUrl: events.sourceUrl,
      isCancelled: events.isCancelled,
      lastVerifiedAt: events.lastVerifiedAt,
      cityName: cities.name,
      typeName: eventTypes.name,
    })
    .from(events)
    .innerJoin(cities, eq(cities.id, events.cityId))
    .leftJoin(eventTypes, eq(eventTypes.id, events.typeId))
    .where(and(eq(events.slug, slug), eq(events.status, "published")))
    .limit(1);
  if (!row) return null;

  const [images, tickets] = await Promise.all([
    db
      .select({ url: eventImages.url, width: eventImages.width, height: eventImages.height })
      .from(eventImages)
      .where(eq(eventImages.eventId, row.id))
      .orderBy(asc(eventImages.position)),
    db
      .select({ name: eventTickets.name, priceIdr: eventTickets.priceIdr, url: eventTickets.url })
      .from(eventTickets)
      .where(eq(eventTickets.eventId, row.id))
      .orderBy(asc(eventTickets.position)),
  ]);
  return { ...row, isCancelled: !!row.isCancelled, images, tickets };
});
