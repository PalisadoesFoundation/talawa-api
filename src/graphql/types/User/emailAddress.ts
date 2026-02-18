import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import { User } from "./User";

/**
 *
 * @param parent - The user object for which the email address is being resolved.
 * @param _args - No arguments are expected for this resolver, so this is an empty object.
 * @param ctx - The GraphQL context, which includes information about the current client and a logger for error handling.
 * @returns The email address of the user if the requester is authorized, otherwise throws an error.
 */
export const emailAddressResolver = async (
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

		return parent.emailAddress;
	} catch (error) {
		// Preserve TalawaGraphQLError instances to maintain proper error codes
		if (error instanceof TalawaGraphQLError) {
			throw error;
		}

		ctx.log.error(error);

		// Only wrap unknown errors as unexpected
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
		emailAddress: t.field({
			description: "Email address of the user.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: emailAddressResolver,
			type: "EmailAddress",
		}),
	}),
});
