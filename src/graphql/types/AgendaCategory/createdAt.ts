import type { GraphQLContext } from "~/src/graphql/context";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { AgendaCategory as AgendaCategoryType } from "./AgendaCategory";
import { AgendaCategory } from "./AgendaCategory";

// Exported resolver for unit testing
export const resolveCreatedAt = async (
	parent: AgendaCategoryType,
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
		with: {
			organizationMembershipsWhereMember: {
				columns: {
					role: true,
				},
				where: (fields, operators) =>
					operators.eq(fields.organizationId, parent.organizationId),
			},
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

	const currentUserOrganizationMembership =
		currentUser.organizationMembershipsWhereMember?.[0];

	if (
		currentUser.role !== "administrator" &&
		(currentUserOrganizationMembership === undefined ||
			currentUserOrganizationMembership.role !== "administrator")
	) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	return parent.createdAt;
};

AgendaCategory.implement({
	fields: (t) => ({
		createdAt: t.field({
			description: "Date time at the time the agenda category was created.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: resolveCreatedAt,
			type: "DateTime",
		}),
	}),
});
