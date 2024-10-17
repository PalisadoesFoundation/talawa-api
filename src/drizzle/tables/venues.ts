import { type InferSelectModel, relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";
import { venueAttachmentsTable } from "./venueAttachments";
import { venueBookingsTable } from "./venueBookings";

export const venuesTable = pgTable(
	"venues",
	{
		capacity: integer("capacity").notNull(),

		createdAt: timestamp("created_at", {
			mode: "date",
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id").references(() => usersTable.id, {}),

		deletedAt: timestamp("deleted_at", {
			mode: "date",
		}),

		description: text("description", {}),

		id: uuid("id").notNull().primaryKey().defaultRandom(),

		name: text("name", {}).notNull(),

		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),
	},
	(self) => ({
		index0: index().on(self.createdAt),
		index1: index().on(self.creatorId),
		index2: index().on(self.name),
		index3: index().on(self.organizationId),
		uniqueIndex0: uniqueIndex().on(self.name, self.organizationId),
	}),
);

export type VenuePgType = InferSelectModel<typeof venuesTable>;

export const venuesTableRelations = relations(venuesTable, ({ many, one }) => ({
	creator: one(usersTable, {
		fields: [venuesTable.creatorId],
		references: [usersTable.id],
		relationName: "users.id:venues.creator_id",
	}),

	organization: one(organizationsTable, {
		fields: [venuesTable.organizationId],
		references: [organizationsTable.id],
		relationName: "organizations.id:venues.organization_id",
	}),

	updater: one(usersTable, {
		fields: [venuesTable.updaterId],
		references: [usersTable.id],
		relationName: "users.id:venues.updater_id",
	}),

	venueAttachmentsWhereVenue: many(venueAttachmentsTable, {
		relationName: "venue_attachments.venue_id:venues.id",
	}),

	venueBookingsWhereVenue: many(venueBookingsTable, {
		relationName: "venue_bookings.venue_id:venues.id",
	}),
}));
