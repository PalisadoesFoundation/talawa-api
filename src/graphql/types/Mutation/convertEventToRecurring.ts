import { eq } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import { builder } from "~/src/graphql/builder";
import {
	MutationConvertEventToRecurringInput,
	mutationConvertEventToRecurringInputSchema,
} from "~/src/graphql/inputs/MutationConvertEventToRecurringInput";
import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import {
	buildRRuleString,
	validateRecurrenceInput,
} from "~/src/utilities/recurringEventHelpers";

const mutationConvertEventToRecurringArgumentsSchema = z.object({
	input: mutationConvertEventToRecurringInputSchema,
});

builder.mutationField("convertEventToRecurring", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationConvertEventToRecurringInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Mutation field to convert a standalone event to a recurring event.",
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
			} = mutationConvertEventToRecurringArgumentsSchema.safeParse(args);

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

			// Validate recurrence input
			validateRecurrenceInput(
				parsedArgs.input.recurrence,
				new Date(), // We'll use the event's actual start time below
			);

			// Find the existing event
			const [currentUser, existingEvent] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.eventsTable.findFirst({
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
						operators.eq(fields.id, parsedArgs.input.eventId),
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (existingEvent === undefined) {
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

			// Check if event is already recurring
			if (existingEvent.isRecurringTemplate) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "eventId"],
								message: "Event is already a recurring event.",
							},
						],
					},
				});
			}

			// Check if event is an instance of a recurring event
			if (existingEvent.recurringEventId) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "eventId"],
								message:
									"Cannot convert a recurring event instance. Convert the base event instead.",
							},
						],
					},
				});
			}

			// Now validate recurrence with actual event start time
			const validationWithEventTime = validateRecurrenceInput(
				parsedArgs.input.recurrence,
				existingEvent.startAt,
			);

			if (!validationWithEventTime.isValid) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: validationWithEventTime.errors.map((error) => ({
							argumentPath: ["input", "recurrence"],
							message: error,
						})),
					},
				});
			}

			const currentUserOrganizationMembership =
				existingEvent.organization.membershipsWhereOrganization[0];

			if (
				currentUser.role !== "administrator" &&
				(currentUserOrganizationMembership === undefined ||
					currentUserOrganizationMembership.role !== "administrator")
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "eventId"],
							},
						],
					},
				});
			}

			return await ctx.drizzleClient.transaction(async (tx) => {
				// Step 1: Convert the event to a recurring template
				const [convertedEvent] = await tx
					.update(eventsTable)
					.set({
						isRecurringTemplate: true,
						updaterId: currentUserId,
					})
					.where(eq(eventsTable.id, parsedArgs.input.eventId))
					.returning();

				if (convertedEvent === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				// Step 2: Create the recurrence rule
				const rruleString = buildRRuleString(
					parsedArgs.input.recurrence,
					convertedEvent.startAt,
				);

				const [createdRecurrenceRule] = await tx
					.insert(recurrenceRulesTable)
					.values({
						recurrenceRuleString: rruleString,
						frequency: parsedArgs.input.recurrence.frequency,
						interval: parsedArgs.input.recurrence.interval || 1,
						recurrenceStartDate: convertedEvent.startAt,
						recurrenceEndDate: parsedArgs.input.recurrence.endDate,
						count: parsedArgs.input.recurrence.count,
						latestInstanceDate: convertedEvent.startAt,
						byDay: parsedArgs.input.recurrence.byDay,
						byMonth: parsedArgs.input.recurrence.byMonth,
						byMonthDay: parsedArgs.input.recurrence.byMonthDay,
						baseRecurringEventId: convertedEvent.id,
						organizationId: convertedEvent.organizationId,
						creatorId: currentUserId,
					})
					.returning();

				if (createdRecurrenceRule === undefined) {
					ctx.log.error(
						"Failed to create recurrence rule during event conversion.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				ctx.log.info("Converted standalone event to recurring template", {
					originalEventId: existingEvent.id,
					newTemplateId: convertedEvent.id,
					recurrenceRuleId: createdRecurrenceRule.id,
					rruleString: rruleString,
				});

				// Return the converted event with attachments
				return Object.assign(convertedEvent, {
					attachments: existingEvent.attachmentsWhereEvent,
				});
			});
		},
		type: Event,
	}),
);
