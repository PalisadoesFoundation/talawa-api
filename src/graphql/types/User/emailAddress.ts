import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import { User } from "./User";

/**
 * Resolver for the User.emailAddress field.
 * 
 * Authorization logic:
 * - Users can view their own email address
 * - Administrators can view any user's email address
 * 
 * The `authenticated` scope ensures the user is logged in.
 * Additional authorization logic checks if the user is viewing their own email
 * or is an administrator.
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
	// Auth plugin ensures user is authenticated
	const currentUserId = ctx.currentClient.user!.id;

	// Check if user is viewing their own email
	const isOwnEmail = parent.id === currentUserId;

	// Check if user is an administrator
	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
		columns: {
			role: true,
		},
		where: (fields, operators) => operators.eq(fields.id, currentUserId),
	});

	const isAdministrator = currentUser?.role === "administrator";

	// Allow access if viewing own email OR if administrator
	if (!isOwnEmail && !isAdministrator) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	return parent.emailAddress;
};

User.implement({
	fields: (t) => ({
		emailAddress: t.field({
			description: "Email address of the user. Users can view their own email, administrators can view any email.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: emailAddressResolver,
			type: "EmailAddress",
			// Require authentication - additional authorization in resolver
			authScopes: {
				authenticated: true,
			},
		}),
	}),
});
