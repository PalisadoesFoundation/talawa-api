import type { GraphQLContext } from "~/src/graphql/context";
import type { User as UserType } from "~/src/graphql/types/User/User";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

/**
 * Resolver for the `creator` field of the `User` type.
 *
 * @param parent - The parent `User` object.
 * @param _args - The arguments for the field (unused).
 * @param ctx - The GraphQL context containing the current client and Drizzle client.
 * @returns The user who created this user, or null if no creator.
 * @throws {TalawaGraphQLError} if the user is unauthenticated or unauthorized.
 */
export const creatorResolver = async (
	parent: UserType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<UserType | null> => {
	try {
		if (!ctx.currentClient.isAuthenticated) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});
		}

		const currentUserId = ctx.currentClient.user.id;

		const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
			where: (fields, operators) => operators.eq(fields.id, currentUserId),
		});

		if (currentUser === undefined) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});
		}

		if (currentUser.role !== "administrator" && currentUserId !== parent.id) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			});
		}

		if (parent.creatorId === null) {
			return null;
		}

		if (parent.creatorId === currentUserId) {
			return currentUser;
		}

		const creatorId = parent.creatorId;

		const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
			where: (fields, operators) => operators.eq(fields.id, creatorId),
		});

		// Creator id existing but the associated user not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
		if (existingUser === undefined) {
			ctx.log.error(
				"Postgres select operation returned an empty array for a user's creator id that isn't null.",
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

User.implement({
	fields: (t) => ({
		creator: t.field({
			description: "User who created the user.",
			resolve: creatorResolver,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			type: User,
		}),
	}),
});
