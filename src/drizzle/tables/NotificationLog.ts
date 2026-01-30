import { relations } from "drizzle-orm";
import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { notificationAudienceTable } from "./NotificationAudience";
import { notificationTemplatesTable } from "./NotificationTemplate";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for notification logs.
 */
export const notificationLogsTable = pgTable(
	"notification_logs",
	{
		/**
		 * Primary unique identifier of the notification log.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Foreign key reference to the id of the template used.
		 */
		
		templateId: uuid("template_id")
			.references(() => notificationTemplatesTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			})
			.notNull(),

		/**
		 * Variables to inject into the template.
		 */
		variables: jsonb("variables"),

		/**
		 * Rendered content after inserting variables.
		 */
		renderedContent: jsonb("rendered_content"),

		/**
		 * Foreign key reference to the id of the user who triggered this notification.
		 */
		sender: uuid("sender").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		/**
		 * Navigation route for the notification.
		 */
		navigation: text("navigation"),

		/**
		 * Type of event that triggered the notification.
		 */
		eventType: text("event_type").notNull(),

		/**
		 * Channel used for notification delivery.
		 */
		channel: text("channel").notNull(),

		/**
		 * Status of the notification.
		 */
		status: text("status").notNull().default("created"),

		/**
		 * Date time at the time the notification was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(self) => [
		index().on(self.templateId),
		index().on(self.status),
		index().on(self.channel),
		index().on(self.createdAt),
	],
);

export const notificationLogsTableRelations = relations(
	notificationLogsTable,
	({ one, many }) => ({
		/**
		 * Many to one relationship from `notification_logs` table to `notification_templates` table.
		 */
		template: one(notificationTemplatesTable, {
			fields: [notificationLogsTable.templateId],
			references: [notificationTemplatesTable.id],
			relationName: "notification_logs.template_id:notification_templates.id",
		}),

		/**
		 * Many to one relationship from `notification_logs` table to `users` table.
		 */
		senderUser: one(usersTable, {
			fields: [notificationLogsTable.sender],
			references: [usersTable.id],
			relationName: "notification_logs.sender:users.id",
		}),

		/**
		 * One to many relationship from `notification_logs` table to `notification_audience` table.
		 */
		audienceWhereNotification: many(notificationAudienceTable, {
			relationName:
				"notification_audience.notification_id:notification_logs.id",
		}),
	}),
);

export const notificationLogsTableInsertSchema = createInsertSchema(
	notificationLogsTable,
	{
		eventType: (schema) => schema.min(1).max(64),
		channel: (schema) => schema.min(1).max(32),
		status: (schema) => schema.min(1).max(32),
		navigation: (schema) => schema.min(1).max(256).optional(),
	},
);
