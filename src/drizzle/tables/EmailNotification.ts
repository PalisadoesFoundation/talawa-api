import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { notificationLogsTable } from "./NotificationLog";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for email notifications.
 */
export const emailNotificationsTable = pgTable(
	"email_notifications",
	{
		/**
		 * Primary unique identifier of the email notification.
		 */
		id: uuid("id")
			.primaryKey()
			.$defaultFn(() => uuidv7()),

		/**
		 * Foreign key reference to the notification log.
		 */
		notificationLogId: uuid("notification_log_id")
			.notNull()
			.references(() => notificationLogsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Foreign key reference to the user receiving the email.
		 * Nullable to support sending emails to external (non-user) recipients.
		 */
		userId: uuid("user_id").references(() => usersTable.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}) /**
		 * Email address where the notification was sent.
		 */,
		email: text("email").notNull(),

		/**
		 * Subject line of the email.
		 */
		subject: text("subject").notNull(),

		/**
		 * HTML body content of the email.
		 */
		htmlBody: text("html_body").notNull(),

		/**
		 * Email delivery status.
		 */
		status: text("status", {
			enum: ["pending", "sent", "delivered", "bounced", "failed"],
		})
			.notNull()
			.default("pending"),

		/**
		 * AWS SES message ID for tracking.
		 */
		sesMessageId: text("ses_message_id"),

		/**
		 * Error message if sending failed.
		 */
		errorMessage: text("error_message"),

		/**
		 * Number of retry attempts.
		 */
		retryCount: integer("retry_count").notNull().default(0),

		/**
		 * Maximum number of retries allowed.
		 */
		maxRetries: integer("max_retries").notNull().default(3),

		/**
		 * When the email was sent successfully.
		 */
		sentAt: timestamp("sent_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		/**
		 * When the email failed permanently.
		 */
		failedAt: timestamp("failed_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		/**
		 * Date time at the time the email notification was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * Date time at the time the email notification was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(self) => [
		index().on(self.notificationLogId),
		index().on(self.userId),
		index().on(self.status),
		index().on(self.createdAt),
	],
);

export const emailNotificationsTableRelations = relations(
	emailNotificationsTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `email_notifications` table to `notification_logs` table.
		 */
		notificationLog: one(notificationLogsTable, {
			fields: [emailNotificationsTable.notificationLogId],
			references: [notificationLogsTable.id],
			relationName:
				"email_notifications.notification_log_id:notification_logs.id",
		}),

		/**
		 * Many to one relationship from `email_notifications` table to `users` table.
		 */
		user: one(usersTable, {
			fields: [emailNotificationsTable.userId],
			references: [usersTable.id],
			relationName: "email_notifications.user_id:users.id",
		}),
	}),
);

export const emailNotificationsTableInsertSchema = createInsertSchema(
	emailNotificationsTable,
	{
		email: (schema) => schema.email().min(1).max(256),
		subject: (schema) => schema.min(1).max(512),
		htmlBody: (schema) => schema.min(1),
		status: (schema) => schema.optional(),
		retryCount: (schema) => schema.optional(),
		maxRetries: (schema) => schema.optional(),
	},
);
