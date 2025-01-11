import { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Event } from "./Event";

Event.implement({
	fields: (t) => ({
		organization: t.field({
			description: "Organization the event belongs to.",
			resolve: async (parent, _args, ctx) => {
				const existingOrganization =
					await ctx.drizzleClient.query.organizationsTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, parent.organizationId),
					});

				// Organziation id existing but the associated organization not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingOrganization === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for an event's organization id that isn't null.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				return existingOrganization;
			},
			type: Organization,
		}),
	}),
});
