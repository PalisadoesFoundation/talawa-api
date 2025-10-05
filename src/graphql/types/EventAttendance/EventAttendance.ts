import type { eventAttendancesTable } from "~/src/drizzle/tables/eventAttendances";
import { builder } from "~/src/graphql/builder";

export type EventAttendanceType = typeof eventAttendancesTable.$inferSelect;

export const EventAttendance =
	builder.objectRef<EventAttendanceType>("EventAttendance");

EventAttendance.implement({
	description: "Represents an event attendance record.",
	fields: (t) => ({
		eventId: t.exposeID("eventId", {
			description: "Event ID",
		}),
		attendeeId: t.exposeID("attendeeId", {
			description: "User ID of attendee",
		}),
		creatorId: t.exposeID("creatorId", {
			description: "User ID of creator",
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
