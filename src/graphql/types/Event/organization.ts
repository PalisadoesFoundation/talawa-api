import type { GraphQLContext } from "~/src/graphql/context";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { Event as EventType } from "./Event";
import { Event } from "./Event";

// Export the resolver function so it can be tested
export const resolveEventOrganization = async (
	parent: EventType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	const existingOrganization = await ctx.dataloaders.organization.load(
		parent.organizationId,
	);

	// Organization id existing but the associated organization not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
	if (existingOrganization === null) {
		ctx.log.error(
			{
				eventId: parent.id,
				organizationId: parent.organizationId,
			},
			"DataLoader returned an empty array for an event's organization id that isn't null",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return existingOrganization;
};

Event.implement({
	fields: (t) => ({
		organization: t.field({
			description: "Organization the event belongs to.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: resolveEventOrganization,
			type: Organization,
		}),
	}),
});
