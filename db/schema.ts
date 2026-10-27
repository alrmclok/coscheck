import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const pk = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`);

export const users = sqliteTable(
  "users",
  {
    id: pk(),
    email: text("email").notNull().unique(),
    name: text("name"),
    role: text("role", { enum: ["admin", "owner"] }).notNull(),
    active: integer("active").notNull().default(1),
    createdAt: createdAt(),
  },
  (t) => [check("users_role_check", sql`${t.role} IN ('admin','owner')`)],
);

// Dikelola owner. Nambah kota baru tidak perlu ubah kode.
export const cities = sqliteTable(
  "cities",
  {
    id: pk(),
    name: text("name").notNull().unique(),
    timezone: text("timezone", {
      enum: ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"],
    }).notNull(), // WIB, WITA, WIT
    active: integer("active").notNull().default(1),
  },
  (t) => [
    check(
      "cities_timezone_check",
      sql`${t.timezone} IN ('Asia/Jakarta','Asia/Makassar','Asia/Jayapura')`,
    ),
  ],
);

export const eventTypes = sqliteTable("event_types", {
  id: pk(),
  name: text("name").notNull().unique(),
  active: integer("active").notNull().default(1),
});

export const events = sqliteTable(
  "events",
  {
    id: pk(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    typeId: text("type_id").references(() => eventTypes.id),
    cityId: text("city_id")
      .notNull()
      .references(() => cities.id),
    timezone: text("timezone").notNull(), // disalin dari kota saat disimpan
    startAt: text("start_at").notNull(), // UTC ISO 8601
    endAt: text("end_at").notNull(), // UTC ISO 8601
    venueName: text("venue_name"),
    mapsUrl: text("maps_url"),
    organizer: text("organizer"),
    ticketMode: text("ticket_mode", { enum: ["paid", "free", "tba"] })
      .notNull()
      .default("tba"),
    sourceUrl: text("source_url").unique(), // link postingan Instagram
    status: text("status", { enum: ["draft", "published", "archived"] })
      .notNull()
      .default("draft"),
    isCancelled: integer("is_cancelled").notNull().default(0),
    lastVerifiedAt: text("last_verified_at"),
    verifiedBy: text("verified_by").references(() => users.id),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
    createdAt: createdAt(),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    index("idx_events_list").on(t.status, t.startAt),
    index("idx_events_city").on(t.cityId, t.startAt),
    check(
      "events_ticket_mode_check",
      sql`${t.ticketMode} IN ('paid','free','tba')`,
    ),
    check(
      "events_status_check",
      sql`${t.status} IN ('draft','published','archived')`,
    ),
  ],
);

// Hanya dipakai kalau ticket_mode = 'paid'
export const eventTickets = sqliteTable("event_tickets", {
  id: pk(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text("name"),
  priceIdr: integer("price_idr").notNull(),
  url: text("url"),
  position: integer("position").notNull().default(0),
});

// position 0 selalu jadi cover
export const eventImages = sqliteTable(
  "event_images",
  {
    id: pk(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    cloudinaryId: text("cloudinary_id").notNull(),
    url: text("url").notNull(),
    width: integer("width"),
    height: integer("height"),
    position: integer("position").notNull(),
  },
  (t) => [index("idx_images_event").on(t.eventId, t.position)],
);

export const reports = sqliteTable(
  "reports",
  {
    id: pk(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    reason: text("reason", {
      enum: ["wrong_date", "wrong_venue", "wrong_price", "cancelled", "other"],
    }).notNull(),
    note: text("note"),
    ipHash: text("ip_hash").notNull(), // hash + salt, IP asli tidak disimpan
    status: text("status", { enum: ["open", "resolved"] })
      .notNull()
      .default("open"),
    resolvedBy: text("resolved_by").references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [
    // Satu laporan terbuka per event per IP
    uniqueIndex("uniq_open_report")
      .on(t.eventId, t.ipHash)
      .where(sql`${t.status} = 'open'`),
    check(
      "reports_reason_check",
      sql`${t.reason} IN ('wrong_date','wrong_venue','wrong_price','cancelled','other')`,
    ),
    check("reports_status_check", sql`${t.status} IN ('open','resolved')`),
  ],
);

export const ownerMessages = sqliteTable(
  "owner_messages",
  {
    id: pk(),
    fromUser: text("from_user")
      .notNull()
      .references(() => users.id),
    kind: text("kind", { enum: ["suggestion", "bug", "request"] }).notNull(),
    body: text("body").notNull(),
    status: text("status", { enum: ["unread", "read", "done"] })
      .notNull()
      .default("unread"),
    createdAt: createdAt(),
  },
  (t) => [
    check(
      "owner_messages_kind_check",
      sql`${t.kind} IN ('suggestion','bug','request')`,
    ),
    check(
      "owner_messages_status_check",
      sql`${t.status} IN ('unread','read','done')`,
    ),
  ],
);

export const auditLog = sqliteTable("audit_log", {
  id: pk(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(), // 'event.create', 'event.verify', 'admin.add', ...
  targetId: text("target_id"),
  detail: text("detail"), // JSON kecil
  createdAt: createdAt(),
});
