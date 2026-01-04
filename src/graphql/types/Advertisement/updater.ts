import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { Advertisement as AdvertisementType } from "./Advertisement";
import { Advertisement } from "./Advertisement";

export const advertisementUpdaterResolver = async (
	parent: AdvertisementType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	try {
		if (!ctx.currentClient.isAuthenticated) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});
		}

		const currentUserId = ctx.currentClient.user?.id;
		if (!currentUserId) {
			throw new TalawaGraphQLError({ extensions: { code: "unauthenticated" } });
		}

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

		if (parent.updaterId === null) {
			return null;
		}

		if (parent.updaterId === currentUserId) {
			return currentUser;
		}

		const updaterId = parent.updaterId;

		const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
			where: (fields, operators) => operators.eq(fields.id, updaterId),
		});

		// Updater id existing but the associated user not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
		if (existingUser === undefined) {
			ctx.log.error(
				"Postgres select operation returned an empty array for an advertisement's updater id that isn't null.",
			);

			throw new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			});
		}

		return existingUser;
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
		updater: t.field({
			description: "User who last updated the advertisement.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: advertisementUpdaterResolver,
			type: User,
		}),
	}),
});
