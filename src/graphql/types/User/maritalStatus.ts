import type { z } from "zod";
import type { userMaritalStatusEnum } from "~/src/drizzle/enums/userMaritalStatus";
import { UserMaritalStatus } from "~/src/graphql/enums/UserMaritalStatus";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import { User } from "./User";

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
