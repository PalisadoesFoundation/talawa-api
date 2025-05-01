import type { GraphQLContext } from "~/src/graphql/context";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItemCategory } from "./actionItemCategory";

/**
 * Resolver for the "creator" field on ActionItemCategory.
 * Ensures only authenticated and authorized users can access creator details.
 */
export const resolveCategoryCreator = async (
	parent: { creatorId: string | null; organizationId: string },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<User | null> => {
	// Step 1: Verify that the client is authenticated
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({ extensions: { code: "unauthenticated" } });
	}

	const currentUserId = ctx.currentClient.user.id;

	// Step 2: Fetch the authenticated user's organization role
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

	// Step 3: If the user does not exist in the DB, treat as unauthenticated
	if (currentUser === undefined) {
		throw new TalawaGraphQLError({ extensions: { code: "unauthenticated" } });
	}

	const membership = currentUser.organizationMembershipsWhereMember[0];

	// Step 4: Authorization — must be an administrator globally or within the organization
	if (
		currentUser.role !== "administrator" &&
		(membership === undefined || membership.role !== "administrator")
	) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthorized_action" },
		});
	}

	// Step 5: If creatorId is null, return null (no creator assigned)
	if (parent.creatorId === null) {
		return null;
	}

	// Step 6: If the creator is the current user, return the already fetched user
	if (parent.creatorId === currentUserId) {
		return currentUser;
	}

	// Step 7: Fetch the user associated with the creatorId
	const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
		where: (fields, operators) =>
			parent.creatorId !== null
				? operators.eq(fields.id, parent.creatorId)
				: undefined,
	});

	// Step 8: Handle the case where the creator could not be found
	if (existingUser === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for an action item category's creator id that isn't null.",
		);
		throw new TalawaGraphQLError({ extensions: { code: "unexpected" } });
	}

	// Step 9: Return the creator user
	return existingUser;
};

// Add the "creator" field to the ActionItemCategory GraphQL type
ActionItemCategory.implement({
	fields: (t) => ({
		creator: t.field({
			type: User,
			nullable: true,
			description: "User who created the action item category.",
			resolve: resolveCategoryCreator,
		}),
	}),
});
