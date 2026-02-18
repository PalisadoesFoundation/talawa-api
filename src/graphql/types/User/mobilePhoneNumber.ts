import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import { User } from "./User";

/**
 * Resolver for the User.mobilePhoneNumber field with access control.
 * Only administrators or the user themselves can access this field.
 *
 * @param parent - The parent User object being resolved
 * @param _args - GraphQL arguments (unused)
 * @param ctx - The GraphQL context containing authentication and database client
 * @returns The user's mobile phone number or throws an error if unauthorized
 */
export const mobilePhoneNumberResolver = async (
	parent: User,
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

		return parent.mobilePhoneNumber;
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
		mobilePhoneNumber: t.field({
			description:
				"The phone number to use to communicate with the user on their mobile phone.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: mobilePhoneNumberResolver,
			type: "PhoneNumber",
		}),
	}),
});
