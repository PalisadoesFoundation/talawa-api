import type { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { User as UserType } from "./User";
import { User } from "./User";

/**
 * Resolver for the isEmailAddressVerified field of User type.
 * Validates user authentication and authorization before returning the email verification status.
 * Only administrators or the user themselves can access this field.
 *
 * @param parent - The parent User object containing the isEmailAddressVerified field
 * @param _args - GraphQL arguments (unused)
 * @param ctx - GraphQL context containing authentication and database clients
 * @returns The boolean indicating whether the user's email address is verified
 * @throws {TalawaGraphQLError} With code 'unauthenticated' if user is not logged in
 * @throws {TalawaGraphQLError} With code 'unauthorized_action' if user lacks required permissions
 */
export const isEmailAddressVerifiedResolver = async (
	parent: UserType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<boolean> => {
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
