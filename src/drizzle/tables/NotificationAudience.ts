import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	primaryKey,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { notificationLogsTable } from "./NotificationLog";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for notification audience.
 */
export const notificationAudienceTable = pgTable(
	"notification_audience",
	{
		/**
		 * Foreign key reference to the id of the notification.
		 */
		notificationId: uuid("notification_id")
			.notNull()
			.references(() => notificationLogsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * ID of the user who should receive this notification.
		 */
		userId: uuid("user_id")
			.notNull()
			.references(() => usersTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Whether the notification has been read by the target.
		 */
		isRead: boolean("is_read").default(false).notNull(),

		/**
		 * Date time at the time the notification was read.
		 */
		readAt: timestamp("read_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).$defaultFn(() => sql`${null}`),

		/**
		 * Date time at the time the audience entry was created.
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
		index().on(self.notificationId),
		index().on(self.userId),
		index().on(self.isRead),
		primaryKey({
			columns: [self.notificationId, self.userId],
		}),
	],
);

export const notificationAudienceTableRelations = relations(
	notificationAudienceTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `notification_audience` table to `notification_logs` table.
		 */
		notification: one(notificationLogsTable, {
			fields: [notificationAudienceTable.notificationId],
			references: [notificationLogsTable.id],
			relationName:
				"notification_audience.notification_id:notification_logs.id",
		}),

		/**
		 * Many to one relationship from `notification_audience` table to `users` table.
		 */
		user: one(usersTable, {
			fields: [notificationAudienceTable.userId],
			references: [usersTable.id],
			relationName: "notification_audience.user_id:users.id",
		}),
	}),
);
