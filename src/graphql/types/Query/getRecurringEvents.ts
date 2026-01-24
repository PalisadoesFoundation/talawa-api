import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { Event } from "~/src/graphql/types/Event/Event";
import { getRecurringEventInstanceByBaseId } from "~/src/graphql/types/Query/eventQueries";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const MAX_OFFSET = 10_000;

const queryGetRecurringEventsSchema = z.object({
	baseRecurringEventId: z.string().uuid(),
	limit: z.number().int().min(1).max(1000).optional(),
	offset: z.number().int().min(0).max(MAX_OFFSET).optional(),
	includeCancelled: z.boolean().optional(),
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
			limit: t.arg.int({
				description: "Number of events to return. Defaults to 1000. Max 1000.",
				required: false,
				defaultValue: 1000,
			}),
			offset: t.arg.int({
				description: `Number of events to skip. Defaults to 0. Max ${MAX_OFFSET}.`,
				required: false,
				defaultValue: 0,
			}),
			includeCancelled: t.arg.boolean({
				description:
					"Whether to include cancelled instances. Defaults to false.",
				required: false,
				defaultValue: false,
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

			const {
				baseRecurringEventId,
				limit: inputLimit,
				offset: inputOffset,
				includeCancelled: inputIncludeCancelled,
			} = parsedArgs.data;

			const limit = inputLimit ?? 1000;
			const offset = inputOffset ?? 0;
			const includeCancelled = inputIncludeCancelled ?? false;

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
						limit,
						offset,
						includeCancelled,
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
