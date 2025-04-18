import type { GraphQLContext } from "~/src/graphql/context";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItem } from "./ActionItem";

export const resolveCreator = async (
	parent: { creatorId: string | null; organizationId: string },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<User | null> => {
	// 1. Authentication check
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	// 2. Fetch current user + their membership in this org
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
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	const currentUserOrganizationMembership =
		currentUser.organizationMembershipsWhereMember[0];

	// 3. Authorization: must be org administrator by role or membership
	if (
		currentUser.role !== "administrator" &&
		(currentUserOrganizationMembership === undefined ||
			currentUserOrganizationMembership.role !== "administrator")
	) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthorized_action" },
		});
	}

	// 4. Null guard for creatorId
	if (parent.creatorId === null) {
		return null;
	}

	// 5. If the creator is the current user, return the already fetched object
	if (parent.creatorId === currentUserId) {
		return currentUser;
	}

	// 6. Otherwise fetch the creator by ID
	const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
		where: (fields, operators) =>
			parent.creatorId !== null
				? operators.eq(fields.id, parent.creatorId)
				: operators.isNull(fields.id),
	});

	if (existingUser === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for an action item's creator id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: { code: "unexpected" },
		});
	}

	return existingUser;
};

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
