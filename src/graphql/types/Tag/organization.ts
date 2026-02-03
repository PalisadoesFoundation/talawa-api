import type { GraphQLContext } from "~/src/graphql/context";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { Tag as TagType } from "./Tag";
import { Tag } from "./Tag";

/**
 * Resolves the organization that a tag belongs to.
 *
 * This resolver uses DataLoader for batched organization lookups.
 * Authentication and authorization are handled by the parent Query.tag resolver.
 *
 * @param parent - The parent Tag object containing the organizationId.
 * @param _args - GraphQL arguments (unused).
 * @param ctx - The GraphQL context containing dataloaders and logging utilities.
 * @returns The organization the tag belongs to.
 * @throws TalawaGraphQLError with code "unexpected" if organization is not found (indicates data corruption).
 */
export const resolveOrganization = async (
	parent: TagType,
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
				tagId: parent.id,
				organizationId: parent.organizationId,
			},
			"DataLoader returned null for a tag's organization id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return existingOrganization;
};

Tag.implement({
	fields: (t) => ({
		organization: t.field({
			description: "Organization the tag belongs to.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: resolveOrganization,
			type: Organization,
		}),
	}),
});
