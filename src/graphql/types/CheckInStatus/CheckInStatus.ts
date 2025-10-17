import type { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import type { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";

export type CheckInStatus = {
	id: string;
	user: typeof usersTable.$inferSelect;
	attendee: typeof eventAttendeesTable.$inferSelect;
};

export const CheckInStatus = builder.objectRef<CheckInStatus>("CheckInStatus");

CheckInStatus.implement({
	description: "Represents the check-in status of a user for an event.",
	fields: (t) => ({
		id: t.exposeID("id", {
			description: "Global identifier of the check-in status record.",
			nullable: false,
		}),
		user: t.field({
			description: "The user associated with this check-in status.",
			resolve: (parent) => parent.user,
			type: User,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			nullable: false,
		}),
		checkInTime: t.field({
			description: "Date and time when the user checked in.",
			resolve: (parent) => parent.attendee.checkinTime,
			type: "Date",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			nullable: true,
		}),
		checkOutTime: t.field({
			description: "Date and time when the user checked out.",
			resolve: (parent) => parent.attendee.checkoutTime,
			type: "Date",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			nullable: true,
		}),
		isCheckedIn: t.field({
			description: "Whether the user is currently checked in.",
			resolve: (parent) => parent.attendee.isCheckedIn,
			type: "Boolean",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			nullable: false,
		}),
		isCheckedOut: t.field({
			description: "Whether the user has checked out.",
			resolve: (parent) => parent.attendee.isCheckedOut,
			type: "Boolean",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			nullable: false,
		}),
	}),
});
