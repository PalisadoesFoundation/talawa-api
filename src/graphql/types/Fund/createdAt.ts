import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { Fund } from "./Fund";
import type { Fund as FundType } from "./Fund";

export const FundCreatedAtResolver = async (
	parent: FundType,
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
		currentUser.organizationMembershipsWhereMember[0];

	if (
		currentUser.role !== "administrator" &&
		currentUserOrganizationMembership === undefined
	) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	return parent.createdAt;
};

// Export a function to register the field (called at module load and can be called in tests for coverage)
export const registerFundCreatedAtField = () => {
	Fund.implement({
		fields: (t) => ({
			createdAt: t.field({
				description: "Date time at the time the fund was created.",
				complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
				resolve: FundCreatedAtResolver,
				type: "DateTime",
			}),
		}),
	});
};

// Register the field when the module loads
registerFundCreatedAtField();
