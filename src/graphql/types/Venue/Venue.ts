import type { venuesTable } from "~/src/drizzle/tables/venues";
import { builder } from "~/src/graphql/builder";

export type Venue = typeof venuesTable.$inferSelect;

export const Venue = builder.objectRef<Venue>("Venue");

Venue.implement({
	description: "",
	fields: (t) => ({
		description: t.exposeString("description", {
			description: "Custom information about the venue.",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the venue.",
			nullable: false,
		}),
		name: t.exposeString("name", {
			description: "Name of the venue.",
		}),
	}),
});
