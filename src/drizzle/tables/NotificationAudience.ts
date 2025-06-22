import { relations, sql } from "drizzle-orm";
import {
    boolean,
    index,
    pgTable,
    primaryKey,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { notificationLogsTable } from "./NotificationLog";
import { usersTable } from "./users";
import { organizationsTable } from "./organizations";

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
         * Type of target (organization, user, admins, group chat, etc.).
         */
        targetType: text("target_type").notNull(),
        
        /**
         * ID of the target (user_id, org_id, etc.).
         */
        targetId: uuid("target_id").notNull(),
        
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
        index().on(self.targetType),
        index().on(self.targetId),
        index().on(self.isRead),
        primaryKey({
            columns: [self.notificationId, self.targetType, self.targetId],
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
            relationName: "notification_audience.notification_id:notification_logs.id",
        }),
        
        /**
         * Many to one relationship from `notification_audience` table to `users` table when target is a user.
         */
        userTarget: one(usersTable, {
            fields: [notificationAudienceTable.targetId],
            references: [usersTable.id],
            relationName: "notification_audience.target_id:users.id",
        }),
        
        /**
         * Many to one relationship from `notification_audience` table to `organizations` table when target is an organization.
         */
        organizationTarget: one(organizationsTable, {
            fields: [notificationAudienceTable.targetId],
            references: [organizationsTable.id],
            relationName: "notification_audience.target_id:organizations.id",
        }),
    }),
);

export const notificationAudienceTableInsertSchema = createInsertSchema(
    notificationAudienceTable,
    {
        targetType: (schema) => schema.min(1).max(64),
        isRead: (schema) => schema.optional(),
    },
);