import type { checkInsTable } from "~/src/drizzle/tables/checkIns";
import type { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { CheckIn } from "~/src/graphql/types/CheckIn/CheckIn";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";

export type CheckInStatus = {
	id: string;
	user: typeof usersTable.$inferSelect;
	checkIn?: typeof checkInsTable.$inferSelect | null;
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
		checkIn: t.field({
			description: "The check-in record if the user has checked in.",
			resolve: (parent) => parent.checkIn || null,
			type: CheckIn,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
