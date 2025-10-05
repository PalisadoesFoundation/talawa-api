import type { eventAttendancesTable } from "~/src/drizzle/tables/eventAttendances";
import { builder } from "~/src/graphql/builder";

export type EventAttendanceType = typeof eventAttendancesTable.$inferSelect;

export const EventAttendance =
	builder.objectRef<EventAttendanceType>("EventAttendance");

EventAttendance.implement({
	description: "Represents an event attendance record.",
	fields: (t) => ({
		eventId: t.string({
			description: "Event ID",
			resolve: (attendance) => attendance.eventId,
		}),
		attendeeId: t.string({
			description: "User ID of attendee",
			resolve: (attendance) => attendance.attendeeId,
		}),
		creatorId: t.string({
			description: "User ID of creator",
			resolve: (attendance) => attendance.creatorId,
		}),
		createdAt: t.field({
			type: "DateTime",
			resolve: (obj) => obj.createdAt,
		}),
		updatedAt: t.field({
			type: "DateTime",
			nullable: true,
			resolve: (obj) => obj.updatedAt,
		}),
		checkInAt: t.field({
			type: "DateTime",
			nullable: true,
			resolve: (obj) => obj.checkInAt,
		}),
		checkOutAt: t.field({
			type: "DateTime",
			nullable: true,
			resolve: (obj) => obj.checkOutAt,
		}),
		updaterId: t.exposeID("updaterId", { nullable: true }),
	}),
});
