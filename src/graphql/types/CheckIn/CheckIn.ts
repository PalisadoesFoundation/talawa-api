import type { checkInsTable } from "~/src/drizzle/tables/checkIns";
import { builder } from "~/src/graphql/builder";

export type CheckIn = typeof checkInsTable.$inferSelect;

export const CheckIn = builder.objectRef<CheckIn>("CheckIn");

CheckIn.implement({
	description: "Represents a check-in record for an event attendee.",
	fields: (t) => ({
		id: t.exposeID("id", {
			description: "Global identifier of the check-in record.",
			nullable: false,
		}),
		time: t.expose("time", {
			description: "Date and time when the check-in occurred.",
			type: "DateTime",
			nullable: false,
		}),
		feedbackSubmitted: t.exposeBoolean("feedbackSubmitted", {
			description:
				"Indicates whether feedback has been submitted for this check-in.",
			nullable: false,
		}),
	}),
});
