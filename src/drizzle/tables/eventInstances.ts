import {
	boolean,
	integer,
	pgTable,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { eventsTable } from "./events";

export const eventInstancesTable = pgTable(
	"event_instances",
	{
		/**
		 * Primary unique identifier for each recurring instance row.
		 * Generated via uuidv7 so ordering roughly follows chronology
		 * which keeps inserts cache-friendly and easy to debug.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Links the instance back to the recurring template in eventsTable.
		 * We cascade updates/deletes to keep orphan rows from appearing.
		 * Consumers rely on this to hydrate template defaults quickly.
		 */
		baseEventId: uuid("base_event_id")
			.notNull()
			.references(() => eventsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Instance start timestamp; defaults to now for ad-hoc inserts.
		 * Stores timezone info so downstream calendars can render precisely.
		 */
		startAt: timestamp("start_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * End timestamp in UTC; validation ensures it is after startAt.
		 * Clients often compute duration by subtracting these fields.
		 */
		endAt: timestamp("end_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		/**
		 * Zero-based occurrence counter within the parent template series.
		 * Helps enforce ordering and powers unique(baseEventId, sequence).
		 */
		sequence: integer("sequence_no").notNull(),

		/**
		 * Flags when this instance supplies its own attachment bundle.
		 * API callers skip inheriting template attachments if true.
		 */
		hasAttachmentOverride: boolean("has_attachment_override")
			.notNull()
			.default(false),
	},
	(table) => ({
		uniqueBaseSeq: unique("event_instances_base_event_sequence_unique").on(
			table.baseEventId,
			table.sequence,
		),
	}),
);

const baseEventInstanceSchema = createInsertSchema(eventInstancesTable);

export const eventInstanceSchema = baseEventInstanceSchema.superRefine(
	(data, ctx) => {
		// Guard against negative sequence numbers so pagination stays predictable.
		if (typeof data.sequence === "number" && data.sequence < 0) {
			ctx.addIssue({
				code: "custom",
				path: ["sequence"],
				message:
					"Sequence must be zero or positive so ordering remains deterministic.",
			});
		}

		// Sanity check temporal bounds; Drizzle only enforces types, not chronology.
		if (data.startAt && data.endAt) {
			const start =
				data.startAt instanceof Date ? data.startAt : new Date(data.startAt);
			const end =
				data.endAt instanceof Date ? data.endAt : new Date(data.endAt);

			if (
				!Number.isNaN(start.getTime()) &&
				!Number.isNaN(end.getTime()) &&
				start >= end
			) {
				ctx.addIssue({
					code: "custom",
					path: ["endAt"],
					message:
						"endAt must be greater than startAt for a valid instance window.",
				});
			}
		}
	},
);
