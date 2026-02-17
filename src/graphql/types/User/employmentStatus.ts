import type { z } from "zod";
import type { userEmploymentStatusEnum } from "~/src/drizzle/enums/userEmploymentStatus";
import type { GraphQLContext } from "~/src/graphql/context";
import { UserEmploymentStatus } from "~/src/graphql/enums/UserEmploymentStatus";
import type { User as UserType } from "~/src/graphql/types/User/User";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

/**
 * Resolver for the `employmentStatus` field of the `User` type.
 *
 * @param parent - The parent `User` object.
 * @param _args - The arguments for the field (unused).
 * @param ctx - The GraphQL context containing the current client and Drizzle client.
 * @returns The employment status of the user, or null if not set.
 * @throws {TalawaGraphQLError} if the user is unauthenticated or unauthorized.
 */
export const employmentStatusResolver = async (
	parent: UserType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<z.infer<typeof userEmploymentStatusEnum> | null> => {
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

		return parent.employmentStatus as z.infer<
			typeof userEmploymentStatusEnum
		> | null;
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
		employmentStatus: t.field({
			description: "Employment status of the user.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			nullable: true,
			resolve: employmentStatusResolver,
			type: UserEmploymentStatus,
		}),
	}),
});
