import envConfig from "~/src/utilities/graphqLimits";
import { escapeHTML } from "~/src/utilities/sanitizer";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { User as UserType } from "./User";
import { User } from "./User";

export const UserStateResolver = async (
	parent: UserType,
	_args: unknown,
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

	return escapeHTML(parent.state);
};

User.implement({
	fields: (t) => ({
		state: t.field({
			description: "Name of the state the user resides in.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: UserStateResolver,
			type: "String",
		}),
	}),
});
