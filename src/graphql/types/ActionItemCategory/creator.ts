import type { GraphQLContext } from "~/src/graphql/context";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItemCategory } from "./actionItemCategory";

/**
 * Resolver for the "creator" field on ActionItemCategory.
 * Ensures authentication and authorization before returning the User or null.
 */
export const resolveCategoryCreator = async (
	parent: { creatorId: string | null; organizationId: string },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<User | null> => {
	// 1. Authentication check
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({ extensions: { code: "unauthenticated" } });
	}

	const currentUserId = ctx.currentClient.user.id;

	// 2. Fetch current user + their organization membership
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

	if (currentUser === undefined) {
		throw new TalawaGraphQLError({ extensions: { code: "unauthenticated" } });
	}

	const membership = currentUser.organizationMembershipsWhereMember[0];

	// 3. Authorization: must be administrator by role or membership
	if (
		currentUser.role !== "administrator" &&
		(membership === undefined || membership.role !== "administrator")
	) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthorized_action" },
		});
	}

	// 4. Null guard: if no creatorId, return null
	if (parent.creatorId === null) {
		return null;
	}

	// 5. If current user is the creator, return it
	if (parent.creatorId === currentUserId) {
		return currentUser;
	}

	// 6. Fetch the actual creator
	const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
		where: (fields, operators) =>
			parent.creatorId !== null
				? operators.eq(fields.id, parent.creatorId)
				: undefined,
	});

	if (existingUser === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for an action item category's creator id that isn't null.",
		);
		throw new TalawaGraphQLError({ extensions: { code: "unexpected" } });
	}

	return existingUser;
};

// Wire the resolver into ActionItemCategory type
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
