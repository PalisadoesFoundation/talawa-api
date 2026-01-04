import type { GraphQLContext } from "~/src/graphql/context";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Post, type Post as PostType } from "./Post";

export const resolveOrganization = async (
	parent: PostType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	const existingOrganization = await ctx.dataloaders.organization.load(
		parent.organizationId,
	);

	// Organization id existing but the associated organization not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
	if (existingOrganization === null) {
		ctx.log.error(
			"Postgres select operation returned undefined for a post's organization id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return existingOrganization;
};

Post.implement({
	fields: (t) => ({
		organization: t.field({
			description: "Organization which the post belongs to.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: resolveOrganization,
			type: Organization,
		}),
	}),
});
