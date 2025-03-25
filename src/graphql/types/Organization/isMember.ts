import { and, eq } from "drizzle-orm";
import { organizationMembershipsTable } from "~/src/drizzle/schema";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import {
	Organization,
	type Organization as OrganizationType,
} from "./Organization";

// Extends Organization with membersCount and adminsCount and isMember Fields
Organization.implement({
	fields: (t) => ({
		isMember: t.field({
			description:
				"Indicates whether the current user is a member of this organization.",
			type: "Boolean",
			resolve: isMemberResolver,
		}),
	}),
});

export const isMemberResolver = async (
	parent: OrganizationType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	// Check authentication
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

	const membership =
		await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
			columns: {
				memberId: true,
			},
			where: and(
				eq(organizationMembershipsTable.organizationId, parent.id),
				eq(organizationMembershipsTable.memberId, currentUserId),
			),
		});

	return membership !== undefined;
};
