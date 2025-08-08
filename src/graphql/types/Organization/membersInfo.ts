import { and, count, eq } from "drizzle-orm";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import {
	Organization,
	type Organization as OrganizationType,
} from "./Organization";

export const membersCountResolver = async (
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

	const result = await ctx.drizzleClient
		.select({
			total: count(),
		})
		.from(organizationMembershipsTable)
		.where(eq(organizationMembershipsTable.organizationId, parent.id))
		.then((res) => res[0]?.total ?? 0);

	return result;
};

export const adminsCountResolver = async (
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

	const result = await ctx.drizzleClient
		.select({
			total: count(),
		})
		.from(organizationMembershipsTable)
		.where(
			and(
				eq(organizationMembershipsTable.organizationId, parent.id),
				eq(organizationMembershipsTable.role, "administrator"),
			),
		)
		.then((res) => res[0]?.total ?? 0);

	return result;
};

// Extends Organization with membersCount and adminsCount
Organization.implement({
	fields: (t) => ({
		membersCount: t.int({
			description: "Total number of members in the organization.",
			resolve: membersCountResolver,
		}),

		adminsCount: t.int({
			description: "Total number of admins in the organization.",
			resolve: adminsCountResolver,
		}),
	}),
});
