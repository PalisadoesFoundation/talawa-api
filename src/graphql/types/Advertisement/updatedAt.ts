import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { Advertisement as AdvertisementType } from "./Advertisement";
import { Advertisement } from "./Advertisement";
export const advertisementUpdatedAtResolver = async (
	parent: AdvertisementType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	try {
		if (!parent.updatedAt) {
			throw new TalawaGraphQLError({
				message: "Missing updatedAt value for the advertisement",
				extensions: {
					code: "unexpected",
				},
			});
		}
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

		return parent.updatedAt;
	} catch (error) {
		if (error instanceof TalawaGraphQLError) {
			throw error;
		}
		ctx.log.error(error);
		throw new TalawaGraphQLError({
			message: "Internal server error",
			extensions: {
				code: "unexpected",
			},
		});
	}
};

Advertisement.implement({
	fields: (t) => ({
		updatedAt: t.field({
			description: "Date time at the time the advertisement was last updated.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: advertisementUpdatedAtResolver,
			type: "DateTime",
		}),
	}),
});
