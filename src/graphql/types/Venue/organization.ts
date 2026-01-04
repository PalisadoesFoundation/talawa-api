import type { GraphQLContext } from "~/src/graphql/context";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { Venue as VenueType } from "./Venue";
import { Venue } from "./Venue";

// Export the resolver function so it can be tested
export const resolveOrganization = async (
	parent: VenueType,
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
				venueId: parent.id,
				organizationId: parent.organizationId,
			},
			"DataLoader returned empty result for venue.organizationId",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return existingOrganization;
};

Venue.implement({
	fields: (t) => ({
		organization: t.field({
			description: "Organization the venue belongs to.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: resolveOrganization, // Use the exported function
			type: Organization,
		}),
	}),
});
