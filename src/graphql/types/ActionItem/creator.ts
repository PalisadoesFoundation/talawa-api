import type { GraphQLContext } from "~/src/graphql/context";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItem } from "./actionItem";

/**
 * Resolver function to fetch the creator of an action item.
 * This includes authorization checks and appropriate fallbacks.
 */
export const resolveCreator = async (
	parent: { creatorId: string | null; organizationId: string },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<User | null> => {
	// Step 1: Ensure that the user is authenticated before proceeding
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	// Step 2: Retrieve current user and check their membership in the target organization
	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
		with: {
			organizationMembershipsWhereMember: {
				columns: { role: true },
				where: (fields, operators) =>
					operators.eq(fields.organizationId, parent.organizationId),
			},
		},
		where: (fields, operators) => operators.eq(fields.id, currentUserId),
	});

	// Step 3: If the user or their organization membership is missing, treat as unauthenticated
	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	const currentUserOrganizationMembership =
		currentUser.organizationMembershipsWhereMember[0];

	// Step 4: Enforce authorization - only administrators can resolve creator details
	if (
		currentUser.role !== "administrator" &&
		(currentUserOrganizationMembership === undefined ||
			currentUserOrganizationMembership.role !== "administrator")
	) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthorized_action" },
		});
	}

	// Step 5: If creatorId is null, return null as no creator exists
	if (parent.creatorId === null) {
		return null;
	}

	// Step 6: If the creator is the current user, reuse the already fetched user object
	if (parent.creatorId === currentUserId) {
		return currentUser;
	}

	// Step 7: Otherwise, fetch the creator user by their ID
	const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
		where: (fields, operators) =>
			parent.creatorId !== null
				? operators.eq(fields.id, parent.creatorId)
				: undefined,
	});

	// Step 8: If no user was found for a non-null creatorId, throw an error
	if (existingUser === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for an action item's creator id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: { code: "unexpected" },
		});
	}

	// Step 9: Return the fetched user as the creator
	return existingUser;
};

// GraphQL schema implementation for the ActionItem type
// Adds a nullable "creator" field to retrieve the user who created the item
ActionItem.implement({
	fields: (t) => ({
		creator: t.field({
			type: User,
			nullable: true,
			description: "User who created the action item.",
			resolve: resolveCreator,
		}),
	}),
});
