import type { GraphQLContext } from "~/src/graphql/context";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { ActionItemCategory as ActionItemCategoryType } from "./ActionItemCategory";
import { ActionItemCategory } from "./ActionItemCategory";

export const resolveUpdatedAt = async (
	parent: ActionItemCategoryType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<Date> => {
	try {
		if (!parent.updatedAt) {
			throw new TalawaGraphQLError({
				message: "Missing updatedAt value for the action item category",
				extensions: {
					code: "unexpected",
				},
			});
		}

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
			(currentUserOrganizationMembership === undefined ||
				currentUserOrganizationMembership.role !== "administrator")
		) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			});
		}

		return parent.updatedAt;
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

ActionItemCategory.implement({
	fields: (t) => ({
		updatedAt: t.field({
			description: "Timestamp when the action item category was last updated.",
			resolve: resolveUpdatedAt,
			type: "DateTime",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
