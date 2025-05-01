import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { ActionItem as ActionItemType } from "./actionItem";

/**
 * Resolver for retrieving the `updatedAt` timestamp of an ActionItem.
 * Includes authentication and authorization checks to ensure access is restricted.
 */
export const actionItemUpdatedAtResolver = async (
	parent: ActionItemType,
	_args: unknown,
	ctx: GraphQLContext,
) => {
	try {
		// Step 1: Ensure the action item has an updatedAt timestamp
		if (!parent.updatedAt) {
			throw new TalawaGraphQLError({
				message: "Missing updatedAt value for the action item",
				extensions: {
					code: "unexpected",
				},
			});
		}

		// Step 2: Verify that the user is authenticated
		if (!ctx.currentClient.isAuthenticated) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});
		}

		const currentUserId = ctx.currentClient.user.id;

		// Step 3: Retrieve the current user and their organization membership
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

		// Step 4: If user is not found, treat as unauthenticated
		if (currentUser === undefined) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});
		}

		const currentUserOrganizationMembership =
			currentUser.organizationMembershipsWhereMember[0];

		// Step 5: Authorization check — allow only administrators to access updatedAt
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

		// Step 6: Return the updatedAt timestamp
		return parent.updatedAt;
	} catch (error) {
		// Step 7: Handle TalawaGraphQLError separately; otherwise treat as internal error
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
