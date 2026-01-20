import type { GraphQLContext } from "~/src/graphql/context";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { Venue as VenueType } from "./Venue";
import { Venue } from "./Venue";

/**
 * Resolves the organization that a venue belongs to.
 *
 * @param parent - The parent Venue object containing the organizationId.
 * @param _args - GraphQL arguments (unused).
 * @param ctx - The GraphQL context containing dataloaders and logging utilities.
 * @returns The organization the venue belongs to.
 * @throws TalawaGraphQLError with code "unexpected" if organization is not found (indicates data corruption).
 */
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
			"DataLoader returned null for a venue's organization id that isn't null.",
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
