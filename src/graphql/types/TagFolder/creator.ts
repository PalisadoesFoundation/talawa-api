import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { TagFolder as TagFolderType } from "./TagFolder";
import { TagFolder } from "./TagFolder";

/**
 * Resolves the creator user for a TagFolder.
 * Requires authentication and administrator permissions (global or organization-level).
 * Uses DataLoader for batched user queries to prevent N+1 behavior.
 *
 * @param parent - The TagFolder parent object
 * @param _args - GraphQL arguments (unused)
 * @param ctx - GraphQL context containing dataloaders and authentication state
 * @returns The creator User object, or null if creatorId is null
 * @throws {TalawaGraphQLError} With code "unauthenticated" if user is not logged in or not found
 * @throws {TalawaGraphQLError} With code "unauthorized_action" if user lacks admin permissions
 * @throws {TalawaGraphQLError} With code "unexpected" if creator user is not found despite non-null creatorId
 */
export const tagFolderCreatorResolver = async (
	parent: TagFolderType,
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

	// Optimization: If creator is current user, return cached currentUser
	if (parent.creatorId === currentUserId) {
		return currentUser;
	}

	const creatorId = parent.creatorId;

	const existingUser = await ctx.dataloaders.user.load(creatorId);

	// Creator id existing but the associated user not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
	if (existingUser === null) {
		ctx.log.error(
			"Postgres select operation returned an empty array for a tag folder's creator id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return existingUser;
};

TagFolder.implement({
	fields: (t) => ({
		creator: t.field({
			description: "User who created the tag folder.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: tagFolderCreatorResolver,
			type: User,
		}),
	}),
});
