import type { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItemCategory } from "./actionItemCategory";

/**
 * Resolver for the createdAt field on ActionItemCategory.
 * This resolver enforces that only authenticated users with administrator
 * privileges can access the creation timestamp of a category.
 */
export const resolveCreatedAt = async (
	parent: { createdAt: Date; organizationId: string },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<Date> => {
	// Step 1: Authentication check
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	// Step 2: Fetch the current user and their organization membership role
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

	// Step 3: If the user record is not found, treat as unauthenticated
	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserOrganizationMembership =
		currentUser.organizationMembershipsWhereMember[0];

	// Step 4: Authorization check — must be an administrator globally or within the org
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

	// Step 5: Return the createdAt timestamp
	return parent.createdAt;
};

// Extend the ActionItemCategory GraphQL type to include the createdAt field
ActionItemCategory.implement({
	fields: (t) => ({
		createdAt: t.field({
			description: "Timestamp when the action item category was created.",
			resolve: resolveCreatedAt,
			type: "DateTime",
		}),
	}),
});
