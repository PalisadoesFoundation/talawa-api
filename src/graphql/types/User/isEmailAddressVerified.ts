import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { User as UserType } from "./User";
import { User } from "./User";

/**
 * Resolver for the `isEmailAddressVerified` field of the `User` type.
 *
 * @param parent - The parent `User` object.
 * @param _args - The arguments for the field (unused).
 * @param ctx - The GraphQL context containing the current client and Drizzle client.
 * @returns Whether the user's email address has been verified.
 * @throws {TalawaGraphQLError} if the user is unauthenticated or unauthorized.
 */
export const isEmailAddressVerifiedResolver = async (
	parent: UserType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
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
			columns: {
				role: true,
			},
			where: (fields, operators) => operators.eq(fields.id, currentUserId),
		});

		if (currentUser === undefined) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});
		}

		if (currentUser.role !== "administrator" && parent.id !== currentUserId) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			});
		}

		return parent.isEmailAddressVerified;
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
		isEmailAddressVerified: t.field({
			description:
				"Boolean to tell whether the user has verified their email address.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: isEmailAddressVerifiedResolver,
			type: "Boolean",
		}),
	}),
});
