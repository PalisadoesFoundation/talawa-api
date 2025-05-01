import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { ActionItemCategory as ActionItemCategoryType } from "./actionItemCategory";

/**
 * Resolver for the "updatedAt" field on ActionItemCategory.
 * Ensures that only authenticated and authorized users can access the timestamp.
 */
export const actionItemCategoryUpdatedAtResolver = async (
	parent: ActionItemCategoryType,
	_args: unknown,
	ctx: GraphQLContext,
): Promise<Date> => {
	try {
		// Step 1: Ensure updatedAt is defined on the parent object
		if (!parent.updatedAt) {
			throw new TalawaGraphQLError({
				message: "Missing updatedAt value for the action item category",
				extensions: {
					code: "unexpected",
				},
			});
		}

		// Step 2: Verify the client is authenticated
		if (!ctx.currentClient.isAuthenticated) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});
		}

		const currentUserId = ctx.currentClient.user.id;

		// Step 3: Fetch the current user and their organization membership
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

		// Step 4: Handle case where user record is not found
		if (currentUser === undefined) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});
		}

		const currentUserOrganizationMembership =
			currentUser.organizationMembershipsWhereMember[0];

		// Step 5: Authorization check — only administrators can access updatedAt
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

		// Step 6: Return the valid updatedAt timestamp
		return parent.updatedAt;
	} catch (error) {
		// Step 7: Rethrow known GraphQL errors, otherwise handle as internal error
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
