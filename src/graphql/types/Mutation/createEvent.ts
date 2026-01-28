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
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
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

						const pairs = createdEventAttachments.map((attachment, index) => ({
							attachment,
							fileUpload: attachments[index],
						}));

						// RETURNING guarantees createdEventAttachments.length === attachments.length,
						// so pairs[i].fileUpload is always defined

						try {
							const uploadResults = await Promise.allSettled(
								pairs.map(({ attachment, fileUpload }) =>
									ctx.minio.client.putObject(
										ctx.minio.bucketName,
										attachment.name,
										(
											fileUpload as NonNullable<typeof fileUpload>
										).createReadStream(),
										undefined,
										{
											"content-type": attachment.mimeType,
										},
									),
								),
							);

							// Collect all successfully uploaded object names
							const uploadedNames: string[] = [];
							let firstError: Error | undefined;

							for (let i = 0; i < uploadResults.length; i++) {
								const result = uploadResults[i];
								const pair = pairs[i];

								if (result?.status === "fulfilled" && pair) {
									uploadedNames.push(pair.attachment.name);
								} else if (result?.status === "rejected" && !firstError) {
									firstError = result.reason;
								}
							}

							// If any uploads failed, clean up all successfully uploaded files
							if (firstError) {
								const cleanupResults = await Promise.allSettled(
									uploadedNames.map((name) =>
										ctx.minio.client.removeObject(ctx.minio.bucketName, name),
									),
								);
								const cleanupFailures = cleanupResults.filter(
									(r) => r.status === "rejected",
								);
								if (cleanupFailures.length) {
									ctx.log.error(
										{ cleanupFailures },
										"Failed to cleanup some uploaded attachments",
									);
								}
								throw firstError;
							}
						} catch (e) {
							ctx.log.error(
								{ error: e },
								"Error uploading event attachments to MinIO",
							);
							throw new TalawaGraphQLError({
								extensions: {
									code: "unexpected",
								},
								message: "Upload failed",
							});
						}
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
			try {
				await ctx.notification?.flush(ctx);
			} catch (error) {
				ctx.log.error(
					{ error },
					"Failed to flush notifications after event create",
				);
			}

			return createdEventResult;
		},
		type: Event,
	}),
);
