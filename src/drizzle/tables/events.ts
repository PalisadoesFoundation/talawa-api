import { relations, sql } from "drizzle-orm";
import {
	boolean,
	check,
	date,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { agendaFoldersTable } from "./agendaFolders";
import { eventAttachmentsTable } from "./eventAttachments";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";
import { venueBookingsTable } from "./venueBookings";

/**
 * Drizzle ORM PostgreSQL table definition for events.
 */
export const eventsTable = pgTable(
	"events",
	{
		/**
		 * Date time when the event was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * User who created the event.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		/**
		 * Optional event description.
		 */
		description: text("description"),

		/**
		 * End timestamp for timed events.
		 * Used only when allDay = false.
		 */
		endAt: timestamp("end_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		/**
		 * End date for all-day events (date only).
		 * Used only when allDay = true.
		 */
		endDate: date("end_date"),

		/**
		 * Primary key for the event.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Event name.
		 */
		name: text("name").notNull(),

		/**
		 * Organization associated with the event.
		 */
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Start timestamp for timed events.
		 * Used only when allDay = false.
		 */
		startAt: timestamp("start_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		/**
		 * Start date for all-day events.
		 * Used only when allDay = true.
		 */
		startDate: date("start_date"),

		/**
		 * Indicates if the event spans the full day.
		 */
		allDay: boolean("all_day").notNull().default(false),

		/**
		 * Whether event requires invite.
		 */
		isInviteOnly: boolean("is_invite_only").notNull().default(false),

		/**
		 * Whether event is publicly visible.
		 */
		isPublic: boolean("is_public").notNull().default(false),

		/**
		 * Whether users can register.
		 */
		isRegisterable: boolean("is_registerable").notNull().default(false),

		/**
		 * Physical or virtual location.
		 */
		location: text("location"),

		/**
		 * Last update timestamp.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),

		/**
		 * User who last updated the event.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		/**
		 * Indicates this event is the base template for recurring instances.
		 */
		isRecurringEventTemplate: boolean("is_recurring_template")
			.notNull()
			.default(false),
	},
	(self) => ({
		/**
		 * Ensures correct field usage depending on allDay value.
		 */
		allDayConsistencyCheck: check(
			"all_day_consistency_check",
			sql`
				CASE
					WHEN ${self.allDay} = true THEN
						${self.startDate} IS NOT NULL AND ${self.endDate} IS NOT NULL
						AND ${self.startAt} IS NULL AND ${self.endAt} IS NULL
					WHEN ${self.allDay} = false THEN
						${self.startAt} IS NOT NULL AND ${self.endAt} IS NOT NULL
						AND ${self.startDate} IS NULL AND ${self.endDate} IS NULL
					ELSE false
				END = true
			`,
		),

		createdAtIdx: index("events_created_at_idx").on(self.createdAt),
		creatorIdIdx: index("events_creator_id_idx").on(self.creatorId),
		endAtIdx: index("events_end_at_idx").on(self.endAt),
		endDateIdx: index("events_end_date_idx").on(self.endDate),
		nameIdx: index("events_name_idx").on(self.name),
		organizationIdIdx: index("events_organization_id_idx").on(
			self.organizationId,
		),
		startAtIdx: index("events_start_at_idx").on(self.startAt),
		startDateIdx: index("events_start_date_idx").on(self.startDate),
		allDayIdx: index("events_all_day_idx").on(self.allDay),
		isInviteOnlyIdx: index("events_is_invite_only_idx").on(self.isInviteOnly),
		isPublicIdx: index("events_is_public_idx").on(self.isPublic),
		isRegisterableIdx: index("events_is_registerable_idx").on(
			self.isRegisterable,
		),
		isRecurringEventTemplateIdx: index("events_is_recurring_template_idx").on(
			self.isRecurringEventTemplate,
		),
	}),
);