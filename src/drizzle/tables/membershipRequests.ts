import { relations } from "drizzle-orm";
import {
	pgTable,
	primaryKey,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
// import { membershipRequestStatusEnumValues } from "~/src/drizzle/enums/membershipRequestStatus";
import { membershipRequestStatusEnumValues } from "~/src/drizzle/enums/membershipRequestStatus";

import { organizationMembershipsTable } from "./organizationMemberships";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

/**
 * Drizzle ORM PostgreSQL table definition for membership requests.
 */
export const membershipRequestsTable = pgTable("membership_requests", {
	membershipRequestId: uuid("membership_request_id") // ✅ Unique Request ID
		.defaultRandom()
		.primaryKey(), // ✅ Primary key for unique requests

	userId: uuid("user_id")
		.notNull()
		.references(() => usersTable.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),

	organizationId: uuid("organization_id")
		.notNull()
		.references(() => organizationsTable.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),

	status: text("status", { enum: membershipRequestStatusEnumValues })
		.notNull()
		.default("pending"),

	createdAt: timestamp("created_at", {
		mode: "date",
		precision: 3,
		withTimezone: true,
	})
		.notNull()
		.defaultNow(),
});

/**
 * Relations for membership_requests table.
 */
export const membershipRequestsTableRelations = relations(
	membershipRequestsTable,
	({ one }) => ({
		/**
		 * Many-to-one relationship from `membership_requests` to `users`.
		 */
		user: one(usersTable, {
			fields: [membershipRequestsTable.userId],
			references: [usersTable.id],
			relationName: "membership_requests.user_id:users.id",
		}),

		/**
		 * Many-to-one relationship from `membership_requests` to `organizations`.
		 */
		organization: one(organizationsTable, {
			fields: [membershipRequestsTable.organizationId],
			references: [organizationsTable.id],
			relationName: "membership_requests.organization_id:organizations.id",
		}),

		/**
		 * One-to-One relationship with `organization_memberships`.
		 * If a request is accepted, it will be linked to a membership.
		 */
		membership: one(organizationMembershipsTable, {
			fields: [
				membershipRequestsTable.userId,
				membershipRequestsTable.organizationId,
			],
			references: [
				organizationMembershipsTable.memberId,
				organizationMembershipsTable.organizationId,
			],
			relationName:
				"membership_requests.user_id+organization_id:organization_memberships.member_id+organization_id",
		}),
	}),
);

/**
 * Schema for inserting new membership requests.
 */
export const membershipRequestsTableInsertSchema = createInsertSchema(
	membershipRequestsTable,
);
