import type { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItem } from "./ActionItem";

/**
 * Resolver for the createdAt field on ActionItem.
 * Returns the createdAt timestamp if the current user is authenticated
 * and is either an administrator or has an organization membership with administrator privileges.
 */
// Export the createdAt resolver as a named export.
export const resolveCreatedAt = async (
	parent: { createdAt: Date; organizationId: string },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<Date> => {
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
		currentUser.organizationMembershipsWhereMember[0];

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

	return parent.createdAt;
};

ActionItem.implement({
	fields: (t) => ({
		createdAt: t.field({
			description: "Date time at the time the action item was created.",
			resolve: resolveCreatedAt,
			type: "DateTime",
		}),
	}),
});
