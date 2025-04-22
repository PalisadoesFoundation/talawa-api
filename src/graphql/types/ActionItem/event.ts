import type { GraphQLContext } from "~/src/graphql/context";
import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItem } from "./actionItem";

export const resolveEvent = async (
	parent: { eventId: string | null; organizationId: string },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<Event | null> => {
	// 1. Authentication check
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	// 2. Fetch current user + their membership in this org
	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
		with: {
			organizationMembershipsWhereMember: {
				columns: { role: true },
				where: (fields, operators) =>
					operators.eq(fields.organizationId, parent.organizationId),
			},
		},
		where: (fields, operators) => operators.eq(fields.id, currentUserId),
	});

	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	const membership = currentUser.organizationMembershipsWhereMember[0];

	// 3. Authorization: must be org administrator by role or membership
	if (
		currentUser.role !== "administrator" &&
		(membership === undefined || membership.role !== "administrator")
	) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthorized_action" },
		});
	}

	// Null guard: if no eventId, return null
	if (!parent.eventId) {
		return null;
	}

	// Lookup the event (with its attachments)
	const existingEvent = await ctx.drizzleClient.query.eventsTable.findFirst({
		where: (fields, operators) =>
			operators.eq(fields.id, parent.eventId as string),
		with: {
			attachmentsWhereEvent: true,
		},
	});

	if (!existingEvent) {
		ctx.log.error(
			"Postgres select operation returned no row for action item's eventId that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: {
				code: "arguments_associated_resources_not_found",
				issues: [{ argumentPath: ["eventId"] }],
			},
		});
	}

	// Merge in the attachments and return
	return Object.assign(existingEvent, {
		attachments: existingEvent.attachmentsWhereEvent,
	});
};

ActionItem.implement({
	fields: (t) => ({
		event: t.field({
			type: Event,
			nullable: true,
			description:
				"Fetch the event associated with this action item, including attachments if available.",
			resolve: resolveEvent,
		}),
	}),
});
