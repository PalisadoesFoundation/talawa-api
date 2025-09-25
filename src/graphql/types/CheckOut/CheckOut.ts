import type { checkOutsTable } from "~/src/drizzle/tables/checkOuts";
import { builder } from "~/src/graphql/builder";

export type CheckOut = typeof checkOutsTable.$inferSelect;

export const CheckOut = builder.objectRef<CheckOut>("CheckOut");

CheckOut.implement({
	description: "Represents a check-out record for an event attendee.",
	fields: (t) => ({
		id: t.exposeID("id", {
			description: "Global identifier of the check-out record.",
			nullable: false,
		}),
		time: t.expose("time", {
			description: "Date and time when the check-out occurred.",
			type: "DateTime",
			nullable: false,
		}),
	}),
});
