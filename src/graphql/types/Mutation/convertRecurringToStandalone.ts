import { eq } from "drizzle-orm";
import { z } from "zod";
import { eventExceptionsTable } from "~/src/drizzle/tables/eventExceptions";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import { builder } from "~/src/graphql/builder";
import {
	MutationConvertRecurringToStandaloneInput,
	mutationConvertRecurringToStandaloneInputSchema,
} from "~/src/graphql/inputs/MutationConvertRecurringToStandaloneInput";
import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

const mutationConvertRecurringToStandaloneArgumentsSchema = z.object({
	input: mutationConvertRecurringToStandaloneInputSchema,
});

builder.mutationField("convertRecurringToStandalone", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationConvertRecurringToStandaloneInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Mutation field to convert a recurring event back to a standalone event.",
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
			} = mutationConvertRecurringToStandaloneArgumentsSchema.safeParse(args);

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

			// Check if event is actually a recurring template
			if (!existingEvent.isRecurringTemplate) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "eventId"],
								message: "Event is not a recurring event template.",
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
									"Cannot convert a recurring event instance. Use the base event ID instead.",
							},
						],
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
				// Step 1: Delete all related recurrence data
				await Promise.all([
					// Delete recurrence rule
					tx
						.delete(recurrenceRulesTable)
						.where(
							eq(
								recurrenceRulesTable.baseRecurringEventId,
								parsedArgs.input.eventId,
							),
						),
					// Delete any exceptions
					tx
						.delete(eventExceptionsTable)
						.where(
							eq(
								eventExceptionsTable.recurringEventId,
								parsedArgs.input.eventId,
							),
						),
				]);

				// Step 2: Convert the event back to standalone
				const [convertedEvent] = await tx
					.update(eventsTable)
					.set({
						isRecurringTemplate: false,
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

				ctx.log.info("Converted recurring event back to standalone", {
					eventId: convertedEvent.id,
					originallyRecurring: true,
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
