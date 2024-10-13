import { type InferSelectModel, relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { recurrenceTypeEnum } from "~/src/drizzle/enums";
import { eventsTable } from "./events";
import { usersTable } from "./users";

export const recurrencesTable = pgTable(
	"recurrences",
	{
		createdAt: timestamp("created_at", {
			mode: "date",
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id").references(() => usersTable.id, {}),

		dayOfMonth: integer("day_of_month"),

		dayOfWeek: integer("day_of_week"),

		deletedAt: timestamp("deleted_at", {
			mode: "date",
		}),

		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id),

		id: uuid("id").notNull().primaryKey().defaultRandom(),

		maxCount: integer("max_count"),

		monthOfYear: integer("month_of_year"),

		rruleString: text("rrule_string").notNull(),

		seperationCount: integer("seperation_count"),

		type: text("type", {
			enum: recurrenceTypeEnum.options,
		}),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),

		weekOfMonth: integer("week_of_month"),
	},
	(self) => ({
		index0: index().on(self.createdAt),
		index1: index().on(self.creatorId),
		index3: index().on(self.eventId),
	}),
);

export type RecurrencePgType = InferSelectModel<typeof recurrencesTable>;

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
