import { and } from "drizzle-orm";
import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import {
	QueryEventInput,
	queryEventInputSchema,
} from "~/src/graphql/inputs/QueryEventInput";
import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import {
	generateVirtualInstances,
	getBaseEventId,
	getInstanceStartTime,
	isVirtualEventId,
} from "~/src/utilities/recurringEventHelpers";
const queryEventArgumentsSchema = z.object({
	input: queryEventInputSchema,
});

builder.queryField("event", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: QueryEventInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Query field to read an event. Supports both real events and virtual recurring instances.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const {
				data: parsedArgs,
				error,
				success,
			} = queryEventArgumentsSchema.safeParse(args);

			if (!success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: error.issues.map((issue) => ({
							argumentPath: issue.path,
							message: issue.message,
						})),
					},
				});
			}

			const currentUserId = ctx.currentClient.user.id;
			const eventId = parsedArgs.input.id;

			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: {
					role: true,
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

			// Check if this is a virtual instance ID
			if (isVirtualEventId(eventId)) {
				// Handle virtual instance
				const baseEventId = getBaseEventId(eventId);
				const instanceStartTime = getInstanceStartTime(eventId);

				if (!instanceStartTime) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "id"],
								},
							],
						},
					});
				}

				// Get the base event
				const baseEvent = await ctx.drizzleClient.query.eventsTable.findFirst({
					with: {
						attachmentsWhereEvent: true,
						organization: {
							columns: {
								countryCode: true,
							},
							with: {
								membershipsWhereOrganization: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.memberId, currentUserId),
								},
							},
						},
					},
					where: (fields, operators) =>
						and(
							operators.eq(fields.id, baseEventId),
							operators.eq(fields.isRecurringTemplate, true),
						),
				});

				if (!baseEvent) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "id"],
								},
							],
						},
					});
				}

				// Check authorization
				const currentUserOrganizationMembership =
					baseEvent.organization.membershipsWhereOrganization[0];

				if (
					currentUser.role !== "administrator" &&
					currentUserOrganizationMembership === undefined
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "id"],
								},
							],
						},
					});
				}

				// Get recurrence rule
				const recurrenceRule =
					await ctx.drizzleClient.query.recurrenceRulesTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.baseRecurringEventId, baseEventId),
					});

				if (!recurrenceRule) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "id"],
								},
							],
						},
					});
				}

				// Get exceptions
				const exceptions =
					await ctx.drizzleClient.query.eventExceptionsTable.findMany({
						where: (fields, operators) =>
							operators.eq(fields.recurringEventId, baseEventId),
					});

				// Generate the specific virtual instance
				const windowStart = new Date(instanceStartTime.getTime() - 1); // 1ms before
				const windowEnd = new Date(instanceStartTime.getTime() + 1); // 1ms after

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

				if (!targetInstance) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "id"],
								},
							],
						},
					});
				}

				// Return virtual instance with attachments
				return Object.assign(targetInstance, {
					attachments: baseEvent.attachmentsWhereEvent,
				});
			}

			// Handle regular event (existing logic)
			const existingEvent = await ctx.drizzleClient.query.eventsTable.findFirst(
				{
					with: {
						attachmentsWhereEvent: true,
						organization: {
							columns: {
								countryCode: true,
							},
							with: {
								membershipsWhereOrganization: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.memberId, currentUserId),
								},
							},
						},
					},
					where: (fields, operators) => operators.eq(fields.id, eventId),
				},
			);

			if (existingEvent === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			const currentUserOrganizationMembership =
				existingEvent.organization.membershipsWhereOrganization[0];

			if (
				currentUser.role !== "administrator" &&
				currentUserOrganizationMembership === undefined
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			return Object.assign(existingEvent, {
				attachments: existingEvent.attachmentsWhereEvent,
			});
		},
		type: Event,
	}),
);
