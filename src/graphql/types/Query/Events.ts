import { inArray } from "drizzle-orm";
import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	generateVirtualInstances,
	getBaseEventId,
	getInstanceStartTime,
	isVirtualEventId,
} from "~/src/utilities/recurringEventHelpers";

const queryEventsByIdsSchema = z.object({
	ids: z.array(z.string()).min(1), // Changed from z.string().uuid() to support virtual IDs
});

builder.queryField("eventsByIds", (t) =>
	t.field({
		type: [Event],
		args: {
			input: t.arg({
				required: true,
				type: builder.inputType("QueryEventsByIdsInput", {
					fields: (t) => ({
						ids: t.field({
							type: ["ID"],
							required: true,
						}),
					}),
				}),
			}),
		},
		description:
			"Fetch multiple events by their IDs. Supports both real event IDs and virtual instance IDs.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const parsedArgs = queryEventsByIdsSchema.safeParse(args.input);
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

			const eventIds = parsedArgs.data.ids;
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

			// Separate regular IDs from virtual IDs
			const regularIds: string[] = [];
			const virtualIds: string[] = [];

			for (const id of eventIds) {
				if (isVirtualEventId(id)) {
					virtualIds.push(id);
				} else {
					regularIds.push(id);
				}
			}

			const events = [];

			// Handle regular events
			if (regularIds.length > 0) {
				const regularEvents =
					await ctx.drizzleClient.query.eventsTable.findMany({
						with: {
							attachmentsWhereEvent: true,
							organization: {
								columns: { countryCode: true },
								with: {
									membershipsWhereOrganization: {
										columns: { role: true },
										where: (fields, operators) =>
											operators.eq(fields.memberId, currentUserId),
									},
								},
							},
						},
						where: (fields, operators) => inArray(fields.id, regularIds),
					});

				// Filter by authorization and add to results
				for (const event of regularEvents) {
					const currentUserOrganizationMembership =
						event.organization.membershipsWhereOrganization[0];

					if (
						currentUser.role === "administrator" ||
						currentUserOrganizationMembership !== undefined
					) {
						events.push(
							Object.assign(event, {
								attachments: event.attachmentsWhereEvent,
							}),
						);
					}
				}
			}

			// Handle virtual instances
			for (const virtualId of virtualIds) {
				try {
					const baseEventId = getBaseEventId(virtualId);
					const instanceStartTime = getInstanceStartTime(virtualId);

					if (!instanceStartTime) {
						continue;
					}

					// Get the base event
					const baseEvent = await ctx.drizzleClient.query.eventsTable.findFirst(
						{
							with: {
								attachmentsWhereEvent: true,
								organization: {
									columns: { countryCode: true },
									with: {
										membershipsWhereOrganization: {
											columns: { role: true },
											where: (fields, operators) =>
												operators.eq(fields.memberId, currentUserId),
										},
									},
								},
							},
							where: (fields, operators) =>
								operators.and(
									operators.eq(fields.id, baseEventId),
									operators.eq(fields.isRecurringTemplate, true),
								),
						},
					);

					if (!baseEvent) {
						continue; // Skip if base event not found
					}

					// Check authorization
					const currentUserOrganizationMembership =
						baseEvent.organization.membershipsWhereOrganization[0];

					if (
						currentUser.role !== "administrator" &&
						currentUserOrganizationMembership === undefined
					) {
						continue; // Skip unauthorized events
					}

					// Get recurrence rule and exceptions
					const [recurrenceRule, exceptions] = await Promise.all([
						ctx.drizzleClient.query.recurrenceRulesTable.findFirst({
							where: (fields, operators) =>
								operators.eq(fields.baseRecurringEventId, baseEventId),
						}),
						ctx.drizzleClient.query.eventExceptionsTable.findMany({
							where: (fields, operators) =>
								operators.eq(fields.recurringEventId, baseEventId),
						}),
					]);

					if (!recurrenceRule) {
						continue; // Skip if no recurrence rule
					}

					// Generate the specific virtual instance
					const windowStart = new Date(instanceStartTime.getTime() - 1);
					const windowEnd = new Date(instanceStartTime.getTime() + 1);

					const virtualInstances = generateVirtualInstances(
						baseEvent,
						recurrenceRule,
						windowStart,
						windowEnd,
						exceptions,
					);

					const targetInstance = virtualInstances.find(
						(instance) =>
							instance.instanceStartTime.getTime() ===
							instanceStartTime.getTime(),
					);

					if (targetInstance) {
						events.push(
							Object.assign(targetInstance, {
								attachments: baseEvent.attachmentsWhereEvent,
							}),
						);
					}
				} catch (error) {
					ctx.log.error("Error processing virtual event ID", {
						virtualId,
						error,
					});
					// Continue processing other events
				}
			}

			if (events.length === 0) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "ids"],
							},
						],
					},
				});
			}

			return events;
		},
	}),
);
