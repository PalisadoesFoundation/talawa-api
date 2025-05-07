// src/graphql/types/ActionItem/updaterResolver.ts

import type { GraphQLContext } from "~/src/graphql/context";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import { ActionItem } from "./actionItem";
/**
 * Resolver to fetch the user who last updated the action item.
 * Includes authentication and authorization checks.
 */
export const resolveUpdater = async (
	parent: {
		updaterId: string | null;
		organizationId: string;
	},
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<User | null> => {
	// Step 1: Ensure the request is made by an authenticated client
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	// Step 2: Fetch the current user and their membership within the relevant organization
	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
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

	// Step 3: If user could not be found, return unauthenticated error
	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserOrganizationMembership =
		currentUser.organizationMembershipsWhereMember[0];

	// Step 4: Only administrators can access updater information
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

	// Step 5: If updaterId is null, return null (no updater assigned)
	if (parent.updaterId === null) {
		return null;
	}

	// Step 6: If current user is the updater, reuse the already fetched user object
	if (parent.updaterId === currentUserId) {
		return currentUser;
	}

	const updaterId = parent.updaterId;

	// Step 7: Query the user associated with the updaterId
	const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
		where: (fields, operators) => operators.eq(fields.id, updaterId),
	});

	// Step 8: If the user doesn't exist, log error and throw unexpected error
	if (existingUser === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for an action item's updater id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	// Step 9: Return the resolved updater user
	return existingUser;
};

ActionItem.implement({
	fields: (t) => ({
		updater: t.field({
			description: "User who last updated the action item.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			type: User,
			resolve: resolveUpdater,
		}),
	}),
});
