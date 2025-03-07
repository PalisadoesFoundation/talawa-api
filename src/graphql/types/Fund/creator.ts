import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import { Fund } from "./Fund";
import type { Fund as Fundtype } from "./Fund";

export const FundCreatorResolver = async (
	parent: Fundtype,
	_args: unknown,
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}
	try {
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
		if (parent.creatorId === null) {
			return null;
		}
		if (parent.creatorId === currentUserId) {
			return currentUser;
		}
		const creatorId = parent.creatorId;
		const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
			where: (fields, operators) => operators.eq(fields.id, creatorId),
		});
		// Creator id existing but the associated user not existing is either a business logic error which means that the corresponding data in the database is in a corrupted state or it is a rare race condition. It must be investigated and fixed as soon as possible to prevent further data corruption if the former case is true.
		if (existingUser === undefined) {
			ctx.log.warn(
				"Postgres select operation returned an empty array for an organization's creator id that isn't null.",
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
Fund.implement({
	fields: (t) => ({
		creator: t.field({
			description: "User who created the Fund.",
			resolve: FundCreatorResolver,
			type: User,
		}),
	}),
});
