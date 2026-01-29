import { relations } from "drizzle-orm";
import {
	index,
	pgTable,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

export const blockedUsersTable = pgTable(
	"blocked_users",
	{
		id: uuid("id").primaryKey().$default(uuidv7),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "date",
			precision: 3,
		})
			.notNull()
			.defaultNow(),
	},
	(self) => [
		uniqueIndex("blocked_users_org_user_unique").on(
			self.organizationId,
			self.userId,
		),
		index("blocked_users_organization_id_idx").on(self.organizationId),
		index("blocked_users_user_id_idx").on(self.userId),
	],
);

export const blockedUsersTableRelations = relations(
	blockedUsersTable,
	({ one }) => ({
		organization: one(organizationsTable, {
			fields: [blockedUsersTable.organizationId],
			references: [organizationsTable.id],
			relationName: "blocked_users.organization_id:organizations.id",
		}),
		user: one(usersTable, {
			fields: [blockedUsersTable.userId],
			references: [usersTable.id],
			relationName: "blocked_users.user_id:users.id",
		}),
	}),
);

export const blockedUsersTableInsertSchema =
	createInsertSchema(blockedUsersTable);
