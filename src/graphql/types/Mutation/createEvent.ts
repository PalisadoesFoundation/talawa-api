import type { FileUpload } from "graphql-upload-minimal";
import { ulid } from "ulidx";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { eventAttachmentMimeTypeEnum } from "~/src/drizzle/enums/eventAttachmentMimeType";
import { eventAttachmentsTable } from "~/src/drizzle/tables/eventAttachments";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateEventInput,
	mutationCreateEventInputSchema,
} from "~/src/graphql/inputs/MutationCreateEventInput";
// import { Event } from "~/src/graphql/types/Event/Event";
import {
	generateInstancesForRecurringEvent,
	initializeGenerationWindow,
} from "~/src/services/eventGeneration";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import {
	buildRRuleString,
	validateRecurrenceInput,
} from "~/src/utilities/recurringEventHelpers";


// Define the CreateEventResult GraphQL object type correctly for Pothos
export const CreateEventResultRef = builder.objectRef<{ id: string }>("CreateEventResult");
CreateEventResultRef.implement({
	description: "Result object for createEvent mutation",
	fields: (t) => ({
		id: t.exposeID("id", { description: "The ID of the created event" }),
	}),
});

const mutationCreateEventArgumentsSchema = z.object({
	input: mutationCreateEventInputSchema.transform(async (arg, ctx) => {
		let attachments:
			| (FileUpload & {
				mimetype: z.infer<typeof eventAttachmentMimeTypeEnum>;
			})[]
			| undefined = undefined;
		if (arg.attachments !== undefined) {
			const rawAttachments = await Promise.all(arg.attachments);
			const result = eventAttachmentMimeTypeEnum
				.array()
				.safeParse(
					rawAttachments.map((attachment: FileUpload) => attachment.mimetype),
				);
			if (!result.success && result.error) {
				for (const issue of result.error.issues) {
					if (typeof issue.path[0] === "number") {
						ctx.addIssue({
							code: "custom",
							path: ["attachments", issue.path[0]],
							message: `Mime type "${rawAttachments[issue.path[0]]?.mimetype}" is not allowed.`,
						});
					}
				}
			}
			if (result.success && result.data) {
				attachments = rawAttachments.map(
					(attachment: FileUpload, index: number) =>
						Object.assign(attachment, {
							mimetype: result.data[index],
						}),
				);
			}
		}
		return {
			...arg,
			attachments,
		};
	}),
});

builder.mutationField("createEvent", (t) =>
	t.field({
		type: builder.objectRef<{ id: string }>("CreateEventResult"),
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateEventInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to create an event.",
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
			} = await mutationCreateEventArgumentsSchema.safeParseAsync(args);

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

			// Validate recurrence input if provided
			if (parsedArgs.input.recurrence) {
				const validation = validateRecurrenceInput(
					parsedArgs.input.recurrence,
					parsedArgs.input.startAt,
				);

				if (!validation.isValid) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: validation.errors.map((error) => ({
								argumentPath: ["input", "recurrence"],
								message: error,
							})),
						},
					});
				}
			}

			const [currentUser, existingOrganization] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.organizationsTable.findFirst({
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
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.organizationId),
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (existingOrganization === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "organizationId"],
							},
						],
					},
				});
			}

			const currentUserOrganizationMembership =
				existingOrganization.membershipsWhereOrganization[0];

			if (currentUserOrganizationMembership === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "organizationId"],
							},
						],
					},
				});
			}

			const createdEventResult = await ctx.drizzleClient.transaction(
				async (tx) => {
					// Create the base event (template for recurring, or standalone event)
					const [createdEvent] = await tx
						.insert(eventsTable)
						.values({
							creatorId: currentUserId,
							description: parsedArgs.input.description,
							endAt: parsedArgs.input.endAt,
							name: parsedArgs.input.name,
							organizationId: parsedArgs.input.organizationId,
							startAt: parsedArgs.input.startAt,
							allDay: parsedArgs.input.allDay ?? false,
							isPublic: parsedArgs.input.isPublic ?? false,
							isRegisterable: parsedArgs.input.isRegisterable ?? false,
							location: parsedArgs.input.location,
							// Set as recurring template if recurrence is provided
							isRecurringEventTemplate: !!parsedArgs.input.recurrence,
							capacity: parsedArgs.input.capacity ?? null,
						})
						.returning();

					// Inserted event not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
					if (createdEvent === undefined) {
						ctx.log.error(
							"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
						);

						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
						});
					}

					// Handle recurring event: Create recurrence rule AND immediately generate instances
					if (parsedArgs.input.recurrence) {
						// Build RRULE string
						const rruleString = buildRRuleString(
							parsedArgs.input.recurrence,
							parsedArgs.input.startAt,
						);

						// Create recurrence rule
						// For new events, the originalSeriesId is the same as the rule's own ID
						const ruleId = uuidv7();
						const [createdRecurrenceRule] = await tx
							.insert(recurrenceRulesTable)
							.values({
								id: ruleId,
								recurrenceRuleString: rruleString,
								frequency: parsedArgs.input.recurrence.frequency,
								interval: parsedArgs.input.recurrence.interval || 1,
								recurrenceStartDate: parsedArgs.input.startAt,
								recurrenceEndDate: parsedArgs.input.recurrence.endDate || null, // null for never-ending events
								count: parsedArgs.input.recurrence.count || null, // null for never-ending events
								latestInstanceDate: parsedArgs.input.startAt,
								byDay: parsedArgs.input.recurrence.byDay,
								byMonth: parsedArgs.input.recurrence.byMonth,
								byMonthDay: parsedArgs.input.recurrence.byMonthDay,
								baseRecurringEventId: createdEvent.id,
								originalSeriesId: ruleId, // For new events, originalSeriesId is the rule's own ID
								organizationId: parsedArgs.input.organizationId,
								creatorId: currentUserId,
							})
							.returning();

						if (createdRecurrenceRule === undefined) {
							ctx.log.error(
								"Failed to create recurrence rule for recurring event.",
							);

							throw new TalawaGraphQLError({
								extensions: {
									code: "unexpected",
								},
							});
						}

						ctx.log.info(
							"Created recurring event template and recurrence rule",
							{
								baseEventId: createdEvent.id,
								recurrenceRuleId: createdRecurrenceRule.id,
								rruleString: rruleString,
							},
						);

						// Ensure generation window exists for the organization
						let windowConfig =
							await ctx.drizzleClient.query.eventGenerationWindowsTable.findFirst(
								{
									where: (fields, operators) =>
										operators.eq(
											fields.organizationId,
											parsedArgs.input.organizationId,
										),
								},
							);

						if (!windowConfig) {
							// Initialize generation window for the organization
							windowConfig = await initializeGenerationWindow(
								{
									organizationId: parsedArgs.input.organizationId,
									createdById: currentUserId,
									// Fixed global settings will be applied automatically
								},
								tx,
								ctx.log,
							);
						}

						//  Determine materialization window based on recurrence pattern
						// Window should start from event start time, not current time
						const windowStartDate = new Date(parsedArgs.input.startAt);
						let windowEndDate: Date;

						ctx.log.debug("FIXED: Window calculation", {
							eventStartAt: parsedArgs.input.startAt.toISOString(),
							windowStartDate: windowStartDate.toISOString(),
							currentTime: new Date().toISOString(),
						});

						if (parsedArgs.input.recurrence.endDate) {
							// For events with end dates, materialize up to the end date
							windowEndDate = new Date(parsedArgs.input.recurrence.endDate);

							// If end date is within the default window, use the window end instead
							const defaultWindowEnd = new Date();
							defaultWindowEnd.setMonth(
								defaultWindowEnd.getMonth() + 12, // Fixed 12 months
							);

							if (windowEndDate > defaultWindowEnd) {
								windowEndDate = defaultWindowEnd;
							}
						} else if (parsedArgs.input.recurrence.count) {
							// For count-based recurrence, estimate end date and use window
							const defaultWindowEnd = new Date();
							defaultWindowEnd.setMonth(
								defaultWindowEnd.getMonth() + 12, // Fixed 12 months
							);
							windowEndDate = defaultWindowEnd;
						} else {
							// For never-ending events, use the materialization window
							const defaultWindowEnd = new Date();
							defaultWindowEnd.setMonth(
								defaultWindowEnd.getMonth() + 12, // Fixed 12 months
							);
							windowEndDate = defaultWindowEnd;
						}

						// Immediately materialize instances for the new recurring event
						await generateInstancesForRecurringEvent(
							{
								baseRecurringEventId: createdEvent.id,
								organizationId: parsedArgs.input.organizationId,
								windowStartDate,
								windowEndDate,
							},
							tx,
							ctx.log,
						);

						ctx.log.info("Materialized initial instances for recurring event", {
							baseEventId: createdEvent.id,
							windowStart: windowStartDate.toISOString(),
							windowEnd: windowEndDate.toISOString(),
							recurrenceType: parsedArgs.input.recurrence.never
								? "never-ending"
								: parsedArgs.input.recurrence.endDate
									? "end-date"
									: "count-based",
							originalRecurrenceInput: parsedArgs.input.recurrence,
							createdRecurrenceRuleId: createdRecurrenceRule.id,
						});
					}

					// Handle attachments (same logic for both recurring and standalone events)
					let createdEventAttachments: (typeof eventAttachmentsTable.$inferSelect)[] =
						[];
					if (parsedArgs.input.attachments !== undefined) {
						const attachments = parsedArgs.input.attachments;

						createdEventAttachments = await tx
							.insert(eventAttachmentsTable)
							.values(
								attachments.map(
									(attachment: FileUpload & { mimetype?: string }) => ({
										creatorId: currentUserId,
										eventId: createdEvent.id,
										mimeType: attachment.mimetype as z.infer<
											typeof eventAttachmentMimeTypeEnum
										>,
										name: ulid(),
									}),
								),
							)
							.returning();

						await Promise.all(
							createdEventAttachments.map((attachment, index) => {
								if (attachments[index] !== undefined) {
									return ctx.minio.client.putObject(
										ctx.minio.bucketName,
										attachment.name,
										attachments[index].createReadStream(),
										undefined,
										{
											"content-type": attachment.mimeType,
										},
									);
								}
								return undefined;
							}),
						);
					}
					return createdEvent;
				},
			);
			// Return the event in the expected GraphQL shape (e.g., { id })
			return { id: createdEventResult.id };
		},
	}),
);
