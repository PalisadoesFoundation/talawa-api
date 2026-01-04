import type { GraphQLContext } from "~/src/graphql/context";
import { User, type User as UserType } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { TagFolder as TagFolderType } from "./TagFolder";
import { TagFolder } from "./TagFolder";

export const resolveUpdater = async (
	parent: TagFolderType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<UserType | null> => {
	if (parent.updaterId === null) {
		return null;
	}

	const updaterId = parent.updaterId;

	const existingUser = await ctx.dataloaders.user.load(updaterId);

	// Updater id existing but the associated user not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
	if (existingUser === null) {
		ctx.log.error(
			"Postgres select operation returned an empty array for a tag folder's updater id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return existingUser;
};

TagFolder.implement({
	fields: (t) => ({
		updater: t.field({
			description: "User who last updated the tag folder.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: resolveUpdater,
			type: User,
		}),
	}),
});
