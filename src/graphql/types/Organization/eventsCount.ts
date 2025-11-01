import { count, eq } from "drizzle-orm";
import { eventsTable } from "~/src/drizzle/schema";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import {
	Organization,
	type Organization as OrganizationType,
} from "./Organization";

export const eventsCountResolver = async (
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
		.from(eventsTable)
		.where(eq(eventsTable.organizationId, parent.id))
		.then((res) => res[0]?.total ?? 0);

	return result;
};

// Extends Organization with membersCount and adminsCount
Organization.implement({
	fields: (t) => ({
		eventsCount: t.int({
			description: "Total number of events in the organization.",
			resolve: eventsCountResolver,
		}),
	}),
});
