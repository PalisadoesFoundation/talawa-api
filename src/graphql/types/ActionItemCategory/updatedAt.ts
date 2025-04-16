import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { ActionItemCategory as ActionItemCategoryType } from "./ActionItemCategory";

export const actionItemCategoryUpdatedAtResolver = async (
	parent: ActionItemCategoryType,
	_args: unknown,
	ctx: GraphQLContext,
): Promise<Date> => {
	try {
		// Ensure updatedAt is present on the parent.
		if (!parent.updatedAt) {
			throw new TalawaGraphQLError({
				message: "Missing updatedAt value for the action item category",
				extensions: {
					code: "unexpected",
				},
			});
		}

		// Check if the current client is authenticated.
		if (!ctx.currentClient.isAuthenticated) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});
		}

		const currentUserId = ctx.currentClient.user.id;

		// Fetch the current user, including their organization memberships.
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

		// Ensure the current user is an administrator either globally or within the organization.
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

		// Return the updatedAt timestamp from the parent.
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
