import type { GraphQLContext } from "~/src/graphql/context";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { ActionItem as ActionItemType } from "./ActionItem";
import { ActionItem } from "./ActionItem";

/**
 * Resolves the creator user for an ActionItem.
 * Requires authentication and administrator permissions (global or organization-level).
 * Uses DataLoader for batched user queries to prevent N+1 behavior.
 *
 * @param parent - The ActionItem parent object
 * @param _args - GraphQL arguments (unused)
 * @param ctx - GraphQL context containing dataloaders and authentication state
 * @returns The creator User object, or null if creatorId is null
 * @throws {TalawaGraphQLError} With code "unauthenticated" if user is not logged in or not found
 * @throws {TalawaGraphQLError} With code "unauthorized_action" if user lacks admin permissions
 * @throws {TalawaGraphQLError} With code "unexpected" if creator user is not found despite non-null creatorId
 */
export const resolveCreator = async (
	parent: ActionItemType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserId = ctx.currentClient.user.id;

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

	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserOrganizationMembership =
		currentUser.organizationMembershipsWhereMember?.[0];

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

	if (parent.creatorId === null) {
		return null;
	}

	if (parent.creatorId === currentUserId) {
		return currentUser;
	}

	const creatorId = parent.creatorId;

	const existingUser = await ctx.dataloaders.user.load(creatorId);

	if (existingUser === null) {
		ctx.log.error(
			"Postgres select operation returned an empty array for an action item's creator id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return existingUser;
};

ActionItem.implement({
	fields: (t) => ({
		creator: t.field({
			description: "User who created the action item.",
			resolve: resolveCreator, // Use the exported function
			type: User,
		}),
	}),
});
