import { relations, sql } from "drizzle-orm";
import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { eventAttendeeRegistrationInviteStatusEnum } from "~/src/drizzle/enums/eventAttendeeRegistrationInviteStatus";
import { eventsTable } from "./events";
import { usersTable } from "./users";

export const eventAttendancesTable = pgTable(
	"event_attendances",
	{
		attendeeId: uuid("attendee_id").references(() => usersTable.id),

		checkInAt: timestamp("check_in_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		checkOutAt: timestamp("check_out_at", {
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

		creatorId: uuid("creator_id")
			.references(() => usersTable.id, {})
			.notNull(),

		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id),

		inviteStatus:
			eventAttendeeRegistrationInviteStatusEnum("invite_status").notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),

		updaterId: uuid("updater_id").references(() => usersTable.id),
	},
	(self) => [
		index().on(self.attendeeId),
		index().on(self.checkInAt),
		index().on(self.checkOutAt),
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.eventId),
		index().on(self.inviteStatus),
	],
);

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
