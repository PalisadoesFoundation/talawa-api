import type { z } from "zod";
import type { userMaritalStatusEnum } from "~/src/drizzle/enums/userMaritalStatus";
import { UserMaritalStatus } from "~/src/graphql/enums/UserMaritalStatus";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import { User } from "./User";

/**
 * Resolver for the user's marital status field.
 *
 * This resolver checks authentication and authorization before returning
 * the marital status of a user. Only authenticated users can access this field,
 * and non-administrators can only access their own marital status.
 *
 * @param parent - The parent User object containing the user's data
 * @param _args - The resolver arguments (unused)
 * @param ctx - The GraphQL context containing authentication and database client
 * @returns The user's marital status or null if not set
 * @throws {TalawaGraphQLError} With code "unauthenticated" if user is not authenticated or not found
 * @throws {TalawaGraphQLError} With code "unauthorized_action" if non-admin tries to access another user's data
 */
export const maritalStatusResolver = async (
	parent: User,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
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

	return parent.maritalStatus as z.infer<typeof userMaritalStatusEnum> | null;
};

User.implement({
	fields: (t) => ({
		maritalStatus: t.field({
			description: "Marital status of the user.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			nullable: true,
			resolve: maritalStatusResolver,
			type: UserMaritalStatus,
		}),
	}),
});
