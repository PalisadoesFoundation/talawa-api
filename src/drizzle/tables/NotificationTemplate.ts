import { relations, sql } from "drizzle-orm";
import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { notificationLogsTable } from "./NotificationLog";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for notification templates.
 */
export const notificationTemplatesTable = pgTable(
	"notification_templates",
	{
		/**
		 * Primary unique identifier of the notification template.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Name of the notification template.
		 */
		name: text("name").notNull(),

		/**
		 * Type of event triggering this notification.
		 */
		eventType: text("event_type").notNull(),

		/**
		 * Title of the notification.
		 */
		title: text("title").notNull(),

		/**
		 * Body content with dynamic placeholders.
		 */
		body: text("body").notNull(),

		/**
		 * Channel type for delivery (email/in-app).
		 */
		channelType: text("channel_type").notNull(),

		/**
		 * Navigation route for onClick action.
		 */
		linkedRouteName: text("linked_route_name"),

		/**
		 * Date time at the time the template was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * Foreign key reference to the id of the user who created the template.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		/**
		 * Date time at the time the template was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),

		/**
		 * Foreign key reference to the id of the user who last updated the template.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		index().on(self.eventType),
		index().on(self.channelType),
		index().on(self.createdAt),
		// Unique constraint: ensures one template per (eventType, channelType) pair
		uniqueIndex("notification_templates_event_type_channel_type_index").on(
			self.eventType,
			self.channelType,
		),
	],
);

export const notificationTemplatesTableRelations = relations(
	notificationTemplatesTable,
	({ one, many }) => ({
		/**
		 * Many to one relationship from `notification_templates` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [notificationTemplatesTable.creatorId],
			references: [usersTable.id],
			relationName: "notification_templates.creator_id:users.id",
		}),

		/**
		 * Many to one relationship from `notification_templates` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [notificationTemplatesTable.updaterId],
			references: [usersTable.id],
			relationName: "notification_templates.updater_id:users.id",
		}),

		/**
		 * One to many relationship from `notification_templates` table to `notification_logs` table.
		 */
		notificationLogsWhereTemplate: many(notificationLogsTable, {
			relationName: "notification_logs.template_id:notification_templates.id",
		}),
	}),
);

export const notificationTemplatesTableInsertSchema = createInsertSchema(
	notificationTemplatesTable,
	{
		name: (schema) => schema.min(1).max(256),
		eventType: (schema) => schema.min(1).max(64),
		title: (schema) => schema.min(1).max(256),
		body: (schema) => schema.min(1).max(4096),
		channelType: (schema) => schema.min(1).max(32),
		linkedRouteName: (schema) => schema.min(1).max(256).optional(),
	},
);
