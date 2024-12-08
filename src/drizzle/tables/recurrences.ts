import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { recurrenceTypeEnum } from "~/src/drizzle/enums/recurrenceType";
import { eventsTable } from "./events";
import { usersTable } from "./users";

export const recurrencesTable = pgTable(
	"recurrences",
	{
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id")
			.references(() => usersTable.id, {})
			.notNull(),

		dayOfMonth: integer("day_of_month"),

		dayOfWeek: integer("day_of_week"),

		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id),

		id: uuid("id").primaryKey().$default(uuidv7),

		maxCount: integer("max_count"),

		monthOfYear: integer("month_of_year"),

		rruleString: text("rrule_string").notNull(),

		seperationCount: integer("seperation_count"),

		type: recurrenceTypeEnum("type").notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),

		weekOfMonth: integer("week_of_month"),
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.eventId),
	],
);

export const recurrencesTableRelations = relations(
	recurrencesTable,
	({ one }) => ({
		creator: one(usersTable, {
			fields: [recurrencesTable.creatorId],
			references: [usersTable.id],
			relationName: "recurrences.creator_id:users.id",
		}),

		event: one(eventsTable, {
			fields: [recurrencesTable.eventId],
			references: [eventsTable.id],
			relationName: "recurrences.event_id:events.id",
		}),

		updater: one(usersTable, {
			fields: [recurrencesTable.updaterId],
			references: [usersTable.id],
			relationName: "recurrences.updater_id:users.id",
		}),
	}),
);
