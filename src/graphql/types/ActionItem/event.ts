import type { GraphQLContext } from "~/src/graphql/context";
import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItem } from "./actionItem";

/**
 * Resolver for fetching the event associated with a specific action item.
 * Includes authentication, authorization, and data enrichment with attachments.
 */
export const resolveEvent = async (
	parent: { eventId: string | null; organizationId: string },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<Event | null> => {
	// Step 1: Ensure the user is authenticated
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	// Step 2: Fetch the currently logged-in user and their membership in the target organization
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

	// Step 3: If user data could not be retrieved, treat as unauthenticated
	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	const membership = currentUser.organizationMembershipsWhereMember[0];

	// Step 4: Authorize only if the user is an administrator globally or in this organization
	if (
		currentUser.role !== "administrator" &&
		(membership === undefined || membership.role !== "administrator")
	) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthorized_action" },
		});
	}

	// Step 5: Guard clause – if eventId is null, return null without querying the database
	if (!parent.eventId) {
		return null;
	}

	// Step 6: Query the event by its ID and include its attachments in the response
	const existingEvent = await ctx.drizzleClient.query.eventsTable.findFirst({
		where: (fields, operators) =>
			operators.eq(fields.id, parent.eventId as string),
		with: {
			attachmentsWhereEvent: true,
		},
	});

	// Step 7: If event is not found, log the issue and throw an error with relevant context
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

	// Step 8: Merge attachments into the event object and return the enriched result
	return Object.assign(existingEvent, {
		attachments: existingEvent.attachmentsWhereEvent,
	});
};

// Extend the GraphQL ActionItem type to include an "event" field.
// This enables clients to query the event linked to the action item.
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
