import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { TagFolder as TagFolderType } from "./TagFolder";
import { TagFolder } from "./TagFolder";

export const tagFolderCreatorResolver = async (
	parent: TagFolderType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	try {
		if (parent.creatorId === null) {
			return null;
		}

		const creatorId = parent.creatorId;

		const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
			where: (fields, operators) => operators.eq(fields.id, creatorId),
		});

		// Creator id existing but the associated user not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
		if (existingUser === undefined) {
			ctx.log.error(
				"Postgres select operation returned an empty array for a tag folder's creator id that isn't null.",
			);

			throw new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			});
		}

		return existingUser;
	} catch (error) {
		if (error instanceof TalawaGraphQLError) {
			throw error;
		}
		ctx.log.error(error);
		throw new TalawaGraphQLError({
			message: "Internal server error",
			extensions: {
				code: "unexpected",
			},
		});
	}
};

TagFolder.implement({
	fields: (t) => ({
		creator: t.field({
			description: "User who created the tag folder.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: tagFolderCreatorResolver,
			type: User,
		}),
	}),
});
