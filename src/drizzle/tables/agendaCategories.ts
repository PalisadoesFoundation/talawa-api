import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { eventsTable } from "./events";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for agenda categories.
 */
export const agendaCategoriesTable = pgTable(
	"agenda_categories",
	{
		/**
		 * Date time at the time the agenda categories was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who created the agenda categories.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Description about the agenda category.
		 */
		description: text("description"),
		/**
		 * Foreign key reference to the id of the event the agenda category is associated to.
		 */
		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Primary unique identifier of the agenda category.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Boolean to tell if the agenda category is default or not.
		 */
		isDefaultCategory: boolean("is_default_categories")
			.notNull()
			.default(false),
		/**
		 * Name of the agenda category.
		 */
		name: text("name", {}).notNull(),
		/**
		 * Foreign key reference to the id of the organization this agenda category belongs to.
		 */
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Date time at the time the agenda categories was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the agenda categories.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.eventId),
		index().on(self.name),
	],
);

export const agendaCategoriesTableRelations = relations(
	agendaCategoriesTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `agenda_categories` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [agendaCategoriesTable.creatorId],
			references: [usersTable.id],
			relationName: "agenda_categories.creator_id:users.id",
		}),
		/**
		 * Many to one relationship from `agenda_categories` table to `events` table.
		 */
		event: one(eventsTable, {
			fields: [agendaCategoriesTable.eventId],
			references: [eventsTable.id],
			relationName: "agenda_categories.event_id:events.id",
		}),
		/**
		 * Many to one relationship from `agenda_categories` table to `org` table.
		 */
		organization: one(organizationsTable, {
			fields: [agendaCategoriesTable.organizationId],
			references: [organizationsTable.id],
			relationName: "agenda_categories.organization_id:organizations.id",
		}),
		/**
		 * Many to one relationship from `agenda_categories` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [agendaCategoriesTable.updaterId],
			references: [usersTable.id],
			relationName: "agenda_categories.updater_id:users.id",
		}),
	}),
);

export const agendaCategoriesTableInsertSchema = createInsertSchema(
	agendaCategoriesTable,
	{
		description: (schema) => schema.min(1).max(2048).optional(),
		name: (schema) => schema.min(1).max(256),
	},
);
