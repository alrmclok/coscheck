CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`target_id` text,
	`detail` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cities` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`timezone` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	CONSTRAINT "cities_timezone_check" CHECK("cities"."timezone" IN ('Asia/Jakarta','Asia/Makassar','Asia/Jayapura'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cities_name_unique` ON `cities` (`name`);--> statement-breakpoint
CREATE TABLE `event_images` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`cloudinary_id` text NOT NULL,
	`url` text NOT NULL,
	`width` integer,
	`height` integer,
	`position` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_images_event` ON `event_images` (`event_id`,`position`);--> statement-breakpoint
CREATE TABLE `event_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`name` text,
	`price_idr` integer NOT NULL,
	`url` text,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `event_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_types_name_unique` ON `event_types` (`name`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`type_id` text,
	`city_id` text NOT NULL,
	`timezone` text NOT NULL,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`venue_name` text,
	`maps_url` text,
	`organizer` text,
	`ticket_mode` text DEFAULT 'tba' NOT NULL,
	`source_url` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`is_cancelled` integer DEFAULT 0 NOT NULL,
	`last_verified_at` text,
	`verified_by` text,
	`created_by` text NOT NULL,
	`updated_by` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`type_id`) REFERENCES `event_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "events_ticket_mode_check" CHECK("events"."ticket_mode" IN ('paid','free','tba')),
	CONSTRAINT "events_status_check" CHECK("events"."status" IN ('draft','published','archived'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_slug_unique` ON `events` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `events_source_url_unique` ON `events` (`source_url`);--> statement-breakpoint
CREATE INDEX `idx_events_list` ON `events` (`status`,`start_at`);--> statement-breakpoint
CREATE INDEX `idx_events_city` ON `events` (`city_id`,`start_at`);--> statement-breakpoint
CREATE TABLE `owner_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`from_user` text NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'unread' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`from_user`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "owner_messages_kind_check" CHECK("owner_messages"."kind" IN ('suggestion','bug','request')),
	CONSTRAINT "owner_messages_status_check" CHECK("owner_messages"."status" IN ('unread','read','done'))
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`reason` text NOT NULL,
	`note` text,
	`ip_hash` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`resolved_by` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "reports_reason_check" CHECK("reports"."reason" IN ('wrong_date','wrong_venue','wrong_price','cancelled','other')),
	CONSTRAINT "reports_status_check" CHECK("reports"."status" IN ('open','resolved'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_open_report` ON `reports` (`event_id`,`ip_hash`) WHERE "reports"."status" = 'open';--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`role` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	CONSTRAINT "users_role_check" CHECK("users"."role" IN ('admin','owner'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);