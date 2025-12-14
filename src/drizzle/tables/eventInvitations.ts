import { relations, sql } from "drizzle-orm";
import {
	index,
	jsonb,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { eventsTable } from "./events";
import { recurringEventInstancesTable } from "./recurringEventInstances";
import { usersTable } from "./users";

/**
 * Table to store event invitations for both users and non-users.
 * Invitations are created with an email and a secure token. When
 * the recipient accepts the invitation the `userId` can be linked
 * and an `event_attendees` record should be created by service logic.
 */
export const eventInvitationsTable = pgTable(
	"event_invitations",
	{
		id: uuid("id").primaryKey().$default(uuidv7),

		// Reference to a standalone event (nullable when invitation is for an instance)
		eventId: uuid("event_id").references(() => eventsTable.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),

		// Reference to a recurring event instance (nullable)
		recurringEventInstanceId: uuid("recurring_event_instance_id").references(
			() => recurringEventInstancesTable.id,
			{
				onDelete: "cascade",
				onUpdate: "cascade",
			},
		),

		// Who sent the invitation
		invitedBy: uuid("invited_by")
			.notNull()
			.references(() => usersTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		// Email of invitee (for non-registered recipients)
		inviteeEmail: varchar("invitee_email", { length: 255 }).notNull(),
		inviteeName: varchar("invitee_name", { length: 255 }),

		// If the invitee already has an account this will be linked after acceptance
		userId: uuid("user_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		// Secure token used in the invitation link
		invitationToken: varchar("invitation_token", { length: 255 }).notNull(),

		// Status: pending, accepted, declined, expired, cancelled
		status: varchar("status", { length: 50 }).notNull().default("pending"),

		expiresAt: timestamp("expires_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		respondedAt: timestamp("responded_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),

		metadata: jsonb("metadata"),
	},
	(self) => ({
		eventIdIdx: index("event_invitations_event_id_idx").on(self.eventId),
		emailIdx: index("event_invitations_email_idx").on(self.inviteeEmail),
		tokenIdx: index("event_invitations_token_idx").on(self.invitationToken),
		statusIdx: index("event_invitations_status_idx").on(self.status),
		createdAtIdx: index("event_invitations_created_at_idx").on(self.createdAt),
	}),
);

export const eventInvitationsTableRelations = relations(
	eventInvitationsTable,
	({ one }) => ({
		invitedByUser: one(usersTable, {
			fields: [eventInvitationsTable.invitedBy],
			references: [usersTable.id],
			relationName: "event_invitations.invited_by:users.id",
		}),

		user: one(usersTable, {
			fields: [eventInvitationsTable.userId],
			references: [usersTable.id],
			relationName: "event_invitations.user_id:users.id",
		}),

		event: one(eventsTable, {
			fields: [eventInvitationsTable.eventId],
			references: [eventsTable.id],
			relationName: "event_invitations.event_id:events.id",
		}),

		recurringInstance: one(recurringEventInstancesTable, {
			fields: [eventInvitationsTable.recurringEventInstanceId],
			references: [recurringEventInstancesTable.id],
			relationName:
				"event_invitations.recurring_event_instance_id:recurring_event_instances.id",
		}),
	}),
);

export const eventInvitationsTableInsertSchema = createInsertSchema(
	eventInvitationsTable,
	{
		inviteeEmail: z.string().email(),
		inviteeName: z.string().optional(),
		eventId: z.string().uuid().optional(),
		recurringEventInstanceId: z.string().uuid().optional(),
		userId: z.string().uuid().optional(),
		invitationToken: z.string().optional(),
		status: z.string().optional(),
		expiresAt: z.date(),
		metadata: z.any().optional(),
	},
);

export type CreateEventInvitationInput = {
	eventId?: string;
	recurringEventInstanceId?: string;
	invitedBy: string;
	inviteeEmail: string;
	inviteeName?: string;
	expiresAt: Date;
	metadata?: unknown;
};

export type UpdateEventInvitationInput = {
	userId?: string | null;
	status?: string;
	respondedAt?: Date;
	metadata?: unknown;
};
