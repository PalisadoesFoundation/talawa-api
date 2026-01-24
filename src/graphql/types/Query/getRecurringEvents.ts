import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { Event } from "~/src/graphql/types/Event/Event";
import { getRecurringEventInstanceByBaseId } from "~/src/graphql/types/Query/eventQueries";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryGetRecurringEventsSchema = z.object({
	baseRecurringEventId: z.string().uuid(),
});

/**
 * Defines the 'getRecurringEvents' query field for fetching all recurring event instances
 * that belong to a specific base recurring event template.
 * This query is similar to the old talawa-api getRecurringEvents but adapted for the new architecture
 * where event templates are in the events table and instances are in the recurring_event_instances table.
 */
builder.queryField("getRecurringEvents", (t) =>
	t.field({
		type: [Event],
		args: {
			baseRecurringEventId: t.arg({
				required: true,
				type: "ID",
				description: "The ID of the base recurring event template",
			}),
		},
		description:
			"Fetches all recurring event instances that belong to a specific base recurring event template.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const parsedArgs = queryGetRecurringEventsSchema.safeParse(args);
			if (!parsedArgs.success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: parsedArgs.error.issues.map((issue) => ({
							argumentPath: issue.path,
							message: issue.message,
						})),
					},
				});
			}

			const { baseRecurringEventId } = parsedArgs.data;
			const currentUserId = ctx.currentClient.user.id;

			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: { role: true },
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});

			if (!currentUser) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			try {
				// First, verify the base recurring event exists and get its organization
				const baseEvent = await ctx.drizzleClient.query.eventsTable.findFirst({
					columns: { organizationId: true, isRecurringEventTemplate: true },
					where: (fields, operators) =>
						operators.eq(fields.id, baseRecurringEventId),
				});

				if (!baseEvent) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["baseRecurringEventId"],
								},
							],
						},
					});
				}

				if (!baseEvent.isRecurringEventTemplate) {
					throw new TalawaGraphQLError({
						message: "The provided event ID is not a recurring event template",
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["baseRecurringEventId"],
									message: "Event must be a recurring event template",
								},
							],
						},
					});
				}

				// Check user authorization for the organization
				const organization =
					await ctx.drizzleClient.query.organizationsTable.findFirst({
						columns: { countryCode: true },
						with: {
							membershipsWhereOrganization: {
								columns: { role: true },
								where: (fields, operators) =>
									operators.eq(fields.memberId, currentUserId),
							},
						},
						where: (fields, operators) =>
							operators.eq(fields.id, baseEvent.organizationId),
					});

				const currentUserOrganizationMembership =
					organization?.membershipsWhereOrganization[0];

				// User can access event if they're a global admin or organization member
				if (
					currentUser.role !== "administrator" &&
					currentUserOrganizationMembership === undefined
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["baseRecurringEventId"],
								},
							],
						},
					});
				}

				// Get all recurring event instances for this base event
				const recurringInstances = await getRecurringEventInstanceByBaseId(
					baseRecurringEventId,
					ctx.drizzleClient,
					ctx.log,
					{
						limit: 1000, // Explicitly set to 1000 to match DEFAULT_LIMIT or as desired
						includeCancelled: false,
					},
				);

				// Transform recurring instances to include attachments (empty for instances)
				const eventsWithAttachments = recurringInstances.map((instance) => ({
					...instance,
					attachments: [], // Recurring event instances don't have direct attachments
				}));

				ctx.log.debug(
					{
						baseRecurringEventId,
						instanceCount: eventsWithAttachments.length,
					},
					"Retrieved recurring events by base ID",
				);

				return eventsWithAttachments;
			} catch (error) {
				ctx.log.error(
					{
						baseRecurringEventId,
						error,
					},
					"Failed to retrieve recurring events",
				);

				// If it's already a TalawaGraphQLError, re-throw it
				if (error instanceof TalawaGraphQLError) {
					throw error;
				}

				throw new TalawaGraphQLError({
					message: "Failed to retrieve recurring events",
					extensions: {
						code: "unexpected",
					},
				});
			}
		},
	}),
);
