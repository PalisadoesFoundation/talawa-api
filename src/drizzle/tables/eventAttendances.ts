import { type InferSelectModel, relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { eventAttendeeRegistrationInviteStatusEnum } from "~/src/drizzle/enums";
import { eventsTable } from "./events";
import { usersTable } from "./users";

export const eventAttendancesTable = pgTable(
	"event_attendances",
	{
		attendeeId: uuid("attendee_id").references(() => usersTable.id),

		checkInAt: timestamp("check_in_at", {
			mode: "date",
		}),

		checkOutAt: timestamp("check_out_at", {
			mode: "date",
		}),

		createdAt: timestamp("created_at", {
			mode: "date",
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id").references(() => usersTable.id, {}),

		deletedAt: timestamp("deleted_at", {
			mode: "date",
		}),

		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id),

		inviteStatus: text("invite_status", {
			enum: eventAttendeeRegistrationInviteStatusEnum.options,
		}).notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id),
	},
	(self) => ({
		index0: index().on(self.attendeeId),
		index1: index().on(self.checkInAt),
		index2: index().on(self.checkOutAt),
		index3: index().on(self.createdAt),
		index4: index().on(self.creatorId),
		index5: index().on(self.eventId),
		index6: index().on(self.inviteStatus),
	}),
);

export type EventAttendancePgType = InferSelectModel<
	typeof eventAttendancesTable
>;

export const eventAttendancesTableRelations = relations(
	eventAttendancesTable,
	({ one }) => ({
		attendee: one(usersTable, {
			fields: [eventAttendancesTable.attendeeId],
			references: [usersTable.id],
			relationName: "event_attendances.attendee_id:users.id",
		}),

		creator: one(usersTable, {
			fields: [eventAttendancesTable.creatorId],
			references: [usersTable.id],
			relationName: "event_attendances.creator_id:users.id",
		}),

		event: one(eventsTable, {
			fields: [eventAttendancesTable.eventId],
			references: [eventsTable.id],
			relationName: "event_attendances.event_id:events.id",
		}),

		updater: one(usersTable, {
			fields: [eventAttendancesTable.updaterId],
			references: [usersTable.id],
			relationName: "event_attendances.updater_id:users.id",
		}),
	}),
);
