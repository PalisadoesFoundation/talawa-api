// Import the GraphQL context type for access to auth, database, and logging
import type { GraphQLContext } from "~/src/graphql/context";

// Custom error class for structured GraphQL error handling in Talawa
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Import the ActionItem GraphQL object type for field extension
import { ActionItem } from "./actionItem";

/**
 * Resolver: resolveCreatedAt
 *
 * Controls access to the `createdAt` field of an ActionItem.
 * Only users who are authenticated and are administrators (either globally or within the organization)
 * are allowed to view this field.
 */
export const resolveCreatedAt = async (
	parent: { createdAt: Date; organizationId: string },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<Date> => {
	// Step 1: Ensure the user is authenticated
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	// Step 2: Get current user ID
	const currentUserId = ctx.currentClient.user.id;

	// Step 3: Fetch the user and their organization membership
	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
		columns: { role: true }, // user's global role
		with: {
			organizationMembershipsWhereMember: {
				columns: { role: true },
				where: (fields, operators) =>
					operators.eq(fields.organizationId, parent.organizationId),
			},
		},
		where: (fields, operators) => operators.eq(fields.id, currentUserId),
	});

	// Step 4: If the user isn't found, treat as unauthenticated
	if (!currentUser) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	// Step 5: Check organization-level role (if available)
	const currentUserOrganizationMembership =
		currentUser.organizationMembershipsWhereMember[0];

	// Step 6: Check both global and organization-level admin roles
	const isGlobalAdmin = currentUser.role === "administrator";
	const isOrgAdmin =
		currentUserOrganizationMembership?.role === "administrator";

	if (!isGlobalAdmin && !isOrgAdmin) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	// Access granted — return the createdAt timestamp
	return parent.createdAt;
};

/**
 * 🔹 Add the protected `createdAt` field to the ActionItem GraphQL type
 * - Uses a custom resolver to enforce role-based access control
 * - Field is still non-nullable but only resolvable by privileged users
 */
ActionItem.implement({
	fields: (t) => ({
		createdAt: t.field({
			description: "Date time at the time the action item was created.",
			resolve: resolveCreatedAt,
			type: "DateTime",
		}),
	}),
});
