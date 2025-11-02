import { count, eq } from "drizzle-orm";
import { blockedUsersTable } from "~/src/drizzle/schema";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import {
	Organization,
	type Organization as OrganizationType,
} from "./Organization";

export const blockedUsersCountResolver = async (
	parent: OrganizationType,
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
		columns: {
			role: true,
		},
		with: {
			organizationMembershipsWhereMember: {
				columns: {
					role: true,
				},
				where: (fields, operators) =>
					operators.eq(fields.organizationId, parent.id),
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

	// Verify user is a member of the organization
	if (currentUser.organizationMembershipsWhereMember.length === 0) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	// Verify user is an admin (blocked users data is sensitive)
	const membership = currentUser.organizationMembershipsWhereMember[0];
	if (
		membership?.role !== "administrator" &&
		currentUser.role !== "administrator"
	) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}
	const result = await ctx.drizzleClient
		.select({
			total: count(),
		})
		.from(blockedUsersTable)
		.where(eq(blockedUsersTable.organizationId, parent.id))
		.then((res) => res[0]?.total ?? 0);

	return result;
};

// Extends Organization with blockedUsersCount
Organization.implement({
	fields: (t) => ({
		blockedUsersCount: t.int({
			description: "Total number of blocked users in the organization.",
			resolve: blockedUsersCountResolver,
		}),
	}),
});
