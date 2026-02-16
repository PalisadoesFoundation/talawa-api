import type { GraphQLContext } from "~/src/graphql/context";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { Venue as VenueType } from "./Venue";
import { Venue } from "./Venue";

/**
 * Resolves the createdAt field for a Venue. Ensures the current user is authenticated
 * and has administrator access (system or organization) before returning the value.
 *
 * @param parent - The parent Venue object containing createdAt and organizationId.
 * @param _args - GraphQL arguments (unused).
 * @param ctx - The GraphQL context (auth, drizzle, etc.).
 * @returns The venue's createdAt date.
 * @throws TalawaGraphQLError with code "unauthenticated" if the client is not authenticated or the current user is not found.
 * @throws TalawaGraphQLError with code "unauthorized_action" if the user is not a system or organization administrator.
 */
export const resolveCreatedAt = async (
	parent: VenueType,
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

Venue.implement({
	fields: (t) => ({
		createdAt: t.field({
			description: "Date time at the time the venue was created.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: resolveCreatedAt,
			type: "DateTime",
		}),
	}),
});
