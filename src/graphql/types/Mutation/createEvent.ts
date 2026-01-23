import type { FileUpload } from "graphql-upload-minimal";
import { ulid } from "ulidx";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { eventAttachmentMimeTypeEnum } from "~/src/drizzle/enums/eventAttachmentMimeType";
import { agendaCategoriesTable } from "~/src/drizzle/tables/agendaCategories";
import { agendaFoldersTable } from "~/src/drizzle/tables/agendaFolders";
import { eventAttachmentsTable } from "~/src/drizzle/tables/eventAttachments";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateEventInput,
	mutationCreateEventInputSchema,
} from "~/src/graphql/inputs/MutationCreateEventInput";
import { Event } from "~/src/graphql/types/Event/Event";
import { executeMutation } from "~/src/graphql/utils/withMutationMetrics";
import {
	generateInstancesForRecurringEvent,
	initializeGenerationWindow,
} from "~/src/services/eventGeneration";
import envConfig from "~/src/utilities/graphqLimits";
import {
	buildRRuleString,
	validateRecurrenceInput,
} from "~/src/utilities/recurringEvent";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const DEFAULT_AGENDA_FOLDER_CONFIG = {
	name: "Default",
	description: "Default agenda folder",
	sequence: 1,
} as const;

const DEFAULT_AGENDA_CATEGORY_CONFIG = {
	name: "Default",
	description: "Default agenda category",
} as const;

export const mutationCreateEventArgumentsSchema = z.object({
	input: mutationCreateEventInputSchema.transform(async (arg, ctx) => {
		const now = new Date();
		const gracePeriod = 2000; // 2 seconds for clock skew
		if (arg.startAt.getTime() < now.getTime() - gracePeriod) {
			ctx.addIssue({
				code: "custom",
				path: ["startAt"],
				message:
					"Start date must be in the future or within the next few seconds",
			});
		}

		let attachments:
			| (FileUpload & {
					mimetype: z.infer<typeof eventAttachmentMimeTypeEnum>;
			  })[]
			| undefined;

		if (arg.attachments !== undefined) {
			const rawAttachments = await Promise.all(arg.attachments);
			const { data, error, success } = eventAttachmentMimeTypeEnum
				.array()
				.safeParse(rawAttachments.map((attachment) => attachment.mimetype));

			if (!success) {
				for (const issue of error.issues) {
					// `issue.path[0]` would correspond to the numeric index of the attachment within `arg.attachments` array which contains the invalid mime type.
					if (typeof issue.path[0] === "number") {
						ctx.addIssue({
							code: "custom",
							path: ["attachments", issue.path[0]],
							message: `Mime type "${
								rawAttachments[issue.path[0]]?.mimetype
							}" is not allowed.`,
						});
					}
				}
			} else {
				attachments = rawAttachments.map((attachment, index) =>
					Object.assign(attachment, {
						mimetype: data[index],
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
			return executeMutation("createEvent", ctx, async () => {
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

				// Validate event visibility: cannot be both Public and Invite-Only
				if (
					parsedArgs.input.isPublic === true &&
					parsedArgs.input.isInviteOnly === true
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["input", "isPublic"],
									message: "cannot be both Public and Invite-Only",
								},
								{
									argumentPath: ["input", "isInviteOnly"],
									message: "cannot be both Public and Invite-Only",
								},
							],
						},
					});
				}

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
							name: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
					ctx.drizzleClient.query.organizationsTable.findFirst({
						columns: {
							countryCode: true,
							name: true,
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
								isInviteOnly: parsedArgs.input.isInviteOnly ?? false,
								location: parsedArgs.input.location,
								// Set as recurring template if recurrence is provided
								isRecurringEventTemplate: !!parsedArgs.input.recurrence,
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

						// Creates default agenda folder
						const [createdAgendaFolder] = await tx
							.insert(agendaFoldersTable)
							.values({
								name: DEFAULT_AGENDA_FOLDER_CONFIG.name,
								description: DEFAULT_AGENDA_FOLDER_CONFIG.description,
								eventId: createdEvent.id,
								organizationId: parsedArgs.input.organizationId,
								isDefaultFolder: true,
								sequence: DEFAULT_AGENDA_FOLDER_CONFIG.sequence,
								creatorId: currentUserId,
							})
							.returning();

						if (createdAgendaFolder === undefined) {
							ctx.log.error(
								"Postgres insert operation for agenda folder unexpectedly returned an empty array.",
							);
							throw new TalawaGraphQLError({
								extensions: {
									code: "unexpected",
								},
							});
						}

						// Creates default agenda category
						const [createdAgendaCategory] = await tx
							.insert(agendaCategoriesTable)
							.values({
								name: DEFAULT_AGENDA_CATEGORY_CONFIG.name,
								description: DEFAULT_AGENDA_CATEGORY_CONFIG.description,
								eventId: createdEvent.id,
								organizationId: parsedArgs.input.organizationId,
								isDefaultCategory: true,
								creatorId: currentUserId,
							})
							.returning();

						if (createdAgendaCategory === undefined) {
							ctx.log.error(
								"Postgres insert operation for agenda category unexpectedly returned an empty array.",
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
									recurrenceEndDate:
										parsedArgs.input.recurrence.endDate || null, // null for never-ending events
									count: parsedArgs.input.recurrence.count || null, // null for never-ending events
									latestInstanceDate: parsedArgs.input.startAt,
									byDay: parsedArgs.input.recurrence.byDay,
									byMonth: parsedArgs.input.recurrence.byMonth,
									byMonthDay: parsedArgs.input.recurrence.byMonthDay,
									baseRecurringEventId: createdEvent.id,
									originalSeriesId: ruleId, // For new events, originalSeriesId is the rule's own ID
									organizationId: parsedArgs.input.organizationId,
									creatorId: currentUserId,
								} as unknown as typeof recurrenceRulesTable.$inferSelect)
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
								{
									baseEventId: createdEvent.id,
									recurrenceRuleId: createdRecurrenceRule.id,
									rruleString: rruleString,
								},
								"Created recurring event template and recurrence rule",
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

							ctx.log.debug(
								{
									eventStartAt: parsedArgs.input.startAt.toISOString(),
									windowStartDate: windowStartDate.toISOString(),
									currentTime: new Date().toISOString(),
								},
								"FIXED: Window calculation",
							);

							// Determine window end date relative to the START date, not current time
							const defaultWindowEnd = new Date(windowStartDate);
							defaultWindowEnd.setMonth(
								defaultWindowEnd.getMonth() + 12, // Fixed 12 months
							);

							if (parsedArgs.input.recurrence.endDate) {
								windowEndDate = new Date(parsedArgs.input.recurrence.endDate);
								// Cap at default window
								if (windowEndDate > defaultWindowEnd) {
									windowEndDate = defaultWindowEnd;
								}
							} else {
								// For count-based or never-ending, use the default window
								windowEndDate = defaultWindowEnd;
							}

							// Safety clamp: end never before start
							if (windowEndDate < windowStartDate) {
								windowEndDate = new Date(windowStartDate);
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

							ctx.log.info(
								{
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
								},
								"Materialized initial instances for recurring event",
							);
						}

						// Handle attachments (same logic for both recurring and standalone events)
						let createdEventAttachments: (typeof eventAttachmentsTable.$inferSelect)[] =
							[];
						if (parsedArgs.input.attachments !== undefined) {
							const attachments = parsedArgs.input.attachments;

							createdEventAttachments = await tx
								.insert(eventAttachmentsTable)
								.values(
									attachments.map((attachment) => ({
										creatorId: currentUserId,
										eventId: createdEvent.id,
										mimeType: attachment.mimetype,
										name: ulid(),
									})),
								)
								.returning();
						}

						const finalEvent = Object.assign(createdEvent, {
							attachments: createdEventAttachments,
							allDay: createdEvent.allDay ?? false,
							isPublic: createdEvent.isPublic ?? false,
							isRegisterable: createdEvent.isRegisterable ?? false,
						});

						try {
							ctx.notification?.enqueueEventCreated({
								eventId: finalEvent.id,
								eventName: finalEvent.name,
								organizationId: finalEvent.organizationId,
								organizationName: existingOrganization.name,
								startDate: finalEvent.startAt.toISOString(),
								creatorName: currentUser.name,
							});
						} catch (error) {
							ctx.log.error({ error }, "Failed to enqueue event notification");
						}

						return finalEvent;
					},
				);

				// Upload attachments to MinIO AFTER transaction commits
				if (
					parsedArgs.input.attachments !== undefined &&
					createdEventResult.attachments.length > 0
				) {
					const attachments = parsedArgs.input.attachments;
					const createdEventAttachments = createdEventResult.attachments;

					// Filter valid upload pairs and track successfully uploaded objects for rollback
					const uploadPairs = createdEventAttachments
						.map((attachment, index) => ({
							attachment,
							inputAttachment: attachments[index],
						}))
						.filter(
							(
								pair,
							): pair is {
								attachment: typeof pair.attachment;
								inputAttachment: NonNullable<typeof pair.inputAttachment>;
							} => pair.inputAttachment !== undefined,
						);

					const uploadedObjectKeys: string[] = [];
					try {
						for (const { attachment, inputAttachment } of uploadPairs) {
							await ctx.minio.client.putObject(
								ctx.minio.bucketName,
								attachment.name,
								inputAttachment.createReadStream(),
								undefined,
								{
									"content-type": attachment.mimeType,
								},
							);
							uploadedObjectKeys.push(attachment.name);
						}
					} catch (uploadError) {
						// ROLLBACK: Delete event (cascades to attachments) and cleanup MinIO
						ctx.log.error(
							{ uploadError },
							"Attachment upload failed, rolling back event creation",
						);

						// Delete event from DB
						try {
							await ctx.drizzleClient.delete(eventsTable).where(
								// @ts-expect-error
								(fields, operators) =>
									operators.eq(fields.id, createdEventResult.id),
							);
						} catch (dbDeleteError) {
							ctx.log.error(
								{ dbDeleteError },
								"CRITICAL: Failed to delete event during rollback",
							);
						}

						// Cleanup successfully uploaded objects
						if (uploadedObjectKeys.length > 0) {
							try {
								await ctx.minio.client.removeObjects(
									ctx.minio.bucketName,
									uploadedObjectKeys,
								);
							} catch (cleanupError) {
								ctx.log.error(
									{ cleanupError, uploadedObjectKeys },
									"Failed to cleanup uploaded objects after upload failure",
								);
							}
						}
						throw uploadError;
					}
				}

				try {
					await ctx.notification?.flush(ctx);
				} catch (error) {
					ctx.log.error(
						{ error },
						"Failed to flush notifications after event create",
					);
				}

				return createdEventResult;
			});
		},
		type: Event,
	}),
);
