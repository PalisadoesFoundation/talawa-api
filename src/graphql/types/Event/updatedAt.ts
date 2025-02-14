import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import { Event } from "./Event";
import type { Event as EventType } from "./Event";

export const eventUpdatedAtResolver = async (
	parent: EventType,
	_args: unknown,
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
			message: "Unexpected error while resolving Event.updatedAt field",
			extensions: {
				code: "unexpected",
			},
		});
	}
};

Event.implement({
	fields: (t) => ({
		updatedAt: t.field({
			description: "Date time at the time the event was last updated.",
			resolve: eventUpdatedAtResolver,
			type: "DateTime",
		}),
	}),
});
