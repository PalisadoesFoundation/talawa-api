import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { User } from "../User/User";
import {
	VolunteerGroups,
	type VolunteerGroups as VolunteerGroupsType,
} from "./VolunteerGroup";

export const resolveCreator = async (
	parent: VolunteerGroupsType,
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

	const event = await ctx.drizzleClient.query.eventsTable.findFirst({
		columns: {
			organizationId: true,
		},
		where: (fields, operators) => operators.eq(fields.id, parent.eventId),
	});

	if (event === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "arguments_associated_resources_not_found",
				issues: [
					{
						argumentPath: ["input", "eventId"],
					},
				],
			},
		});
	}

	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
		with: {
			organizationMembershipsWhereMember: {
				columns: {
					role: true,
				},
				where: (fields, operators) =>
					operators.eq(fields.organizationId, event.organizationId),
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
		currentUserOrganizationMembership === undefined
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

	if (existingUser === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for a group's creator id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return existingUser;
};

VolunteerGroups.implement({
	fields: (t) => ({
		creator: t.field({
			description: "User who has created the Group.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: resolveCreator,
			type: User,
		}),
	}),
});
