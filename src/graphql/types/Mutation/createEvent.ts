import { eq } from "drizzle-orm";

import { z } from "zod";
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
import { runBestEffortInvalidation } from "~/src/graphql/utils/runBestEffortInvalidation";
import { withMutationMetrics } from "~/src/graphql/utils/withMutationMetrics";
import { invalidateEntityLists } from "~/src/services/caching/invalidation";
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
		// For timed events, validate that startAt is not in the past
		if (arg.allDay !== true && arg.startAt) {
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
		}

		if (arg.allDay === true && arg.startDate) {
			const today = new Date().toISOString().slice(0, 10);

			if (arg.startDate < today) {
				ctx.addIssue({
					code: "custom",
					path: ["startDate"],
					message: "Start date must not be in the past",
				});
			}
		}

		return arg;
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
		resolve: withMutationMetrics(
			{
				operationName: "mutation:createEvent",
			},
			async (_parent, args, ctx) => {
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

				// Validate event time model to avoid mixed-mode payloads silently being nulled.
				const hasStartAt = parsedArgs.input.startAt != null;
				const hasEndAt = parsedArgs.input.endAt != null;
				const hasStartDate = parsedArgs.input.startDate != null;
				const hasEndDate = parsedArgs.input.endDate != null;

				if (parsedArgs.input.allDay === true) {
					const issues: { argumentPath: string[]; message: string }[] = [];

					if (hasStartAt) {
						issues.push({
							argumentPath: ["input", "startAt"],
							message: "Must be null when allDay is true.",
						});
					}

					if (hasEndAt) {
						issues.push({
							argumentPath: ["input", "endAt"],
							message: "Must be null when allDay is true.",
						});
					}

					if (hasStartDate !== hasEndDate) {
						issues.push({
							argumentPath: ["input", hasStartDate ? "endDate" : "startDate"],
							message:
								"startDate and endDate must both be provided or both be null.",
						});
					}

					if (issues.length > 0) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues,
							},
						});
					}
				} else {
					const issues: { argumentPath: string[]; message: string }[] = [];

					if (hasStartDate) {
						issues.push({
							argumentPath: ["input", "startDate"],
							message: "Must be null when allDay is false.",
						});
					}

					if (hasEndDate) {
						issues.push({
							argumentPath: ["input", "endDate"],
							message: "Must be null when allDay is false.",
						});
					}

					if (hasStartAt !== hasEndAt) {
						issues.push({
							argumentPath: ["input", hasStartAt ? "endAt" : "startAt"],
							message:
								"startAt and endAt must both be provided or both be null.",
						});
					}

					if (issues.length > 0) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues,
							},
						});
					}
				}

				// Validate recurrence input if provided
				if (parsedArgs.input.recurrence) {
					// For timed events use startAt; for all-day events parse startDate as midnight UTC
					const recurrenceValidationStart =
						parsedArgs.input.allDay === true
							? new Date(`${parsedArgs.input.startDate}T00:00:00Z`)
							: (parsedArgs.input.startAt as Date);

					const validation = validateRecurrenceInput(
						parsedArgs.input.recurrence,
						recurrenceValidationStart,
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
						const isAllDay = parsedArgs.input.allDay ?? false;

						let startAt: Date | null = null;
						let endAt: Date | null = null;
						let startDate: string | null = null;
						let endDate: string | null = null;

						if (
							isAllDay &&
							parsedArgs.input.startDate &&
							parsedArgs.input.endDate
						) {
							startAt = new Date(`${parsedArgs.input.startDate}T00:00:00.000Z`);
							endAt = new Date(`${parsedArgs.input.endDate}T23:59:59.999Z`);

							startDate = parsedArgs.input.startDate;
							endDate = parsedArgs.input.endDate;
						} else {
							startAt = parsedArgs.input.startAt ?? null;
							endAt = parsedArgs.input.endAt ?? null;
						}

						const [createdEvent] = await tx
							.insert(eventsTable)
							.values({
								creatorId: currentUserId,
								description: parsedArgs.input.description,
								name: parsedArgs.input.name,
								organizationId: parsedArgs.input.organizationId,
								allDay: isAllDay,
								isPublic: parsedArgs.input.isPublic ?? false,
								isRegisterable: parsedArgs.input.isRegisterable ?? false,
								isInviteOnly: parsedArgs.input.isInviteOnly ?? false,
								location: parsedArgs.input.location,
								isRecurringEventTemplate: !!parsedArgs.input.recurrence,
								startAt,
								endAt,
								startDate,
								endDate,
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
							// For all-day events, use startDate parsed as midnight UTC; for timed events use startAt
							const recurrenceStart =
								parsedArgs.input.allDay === true
									? new Date(`${parsedArgs.input.startDate}T00:00:00Z`)
									: (parsedArgs.input.startAt as Date);

							const rruleString = buildRRuleString(
								parsedArgs.input.recurrence,
								recurrenceStart,
							);

							// Create recurrence rule
							// For new events, the originalSeriesId is set to the rule's own generated ID after insert
							const [createdRecurrenceRule] = await tx
								.insert(recurrenceRulesTable)
								.values({
									recurrenceRuleString: rruleString,
									frequency: parsedArgs.input.recurrence.frequency,
									interval: parsedArgs.input.recurrence.interval || 1,
									recurrenceStartDate: recurrenceStart,
									recurrenceEndDate:
										parsedArgs.input.recurrence.endDate || null, // null for never-ending events
									count: parsedArgs.input.recurrence.count || null, // null for never-ending events
									latestInstanceDate: recurrenceStart,
									byDay: parsedArgs.input.recurrence.byDay,
									byMonth: parsedArgs.input.recurrence.byMonth,
									byMonthDay: parsedArgs.input.recurrence.byMonthDay,
									baseRecurringEventId: createdEvent.id,
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

							// Set originalSeriesId = the rule's own ID (self-referential for a brand-new series)
							await tx
								.update(recurrenceRulesTable)
								.set({ originalSeriesId: createdRecurrenceRule.id })
								.where(eq(recurrenceRulesTable.id, createdRecurrenceRule.id));
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
							const windowStartDate = new Date(recurrenceStart);
							let windowEndDate: Date;

							const addMonthsUTC = (date: Date, months: number): Date => {
								const result = new Date(date);
								result.setUTCMonth(result.getUTCMonth() + months);

								return result;
							};

							ctx.log.debug(
								{
									eventStartAt: recurrenceStart.toISOString(),
								},
								"FIXED: Window calculation",
							);

							if (parsedArgs.input.recurrence.endDate) {
								// For events with end dates, materialize up to the end date
								windowEndDate = new Date(parsedArgs.input.recurrence.endDate);

								// If end date is within the default window, use the window end instead
								const defaultWindowEnd = addMonthsUTC(
									new Date(),
									windowConfig.hotWindowMonthsAhead,
								);

								if (windowEndDate > defaultWindowEnd) {
									windowEndDate = defaultWindowEnd;
								}
							} else if (parsedArgs.input.recurrence.count) {
								// For count-based recurrence, estimate end date and use window
								const defaultWindowEnd = addMonthsUTC(
									new Date(),
									windowConfig.hotWindowMonthsAhead,
								);
								windowEndDate = defaultWindowEnd;
							} else {
								// For never-ending events, use the materialization window
								const defaultWindowEnd = addMonthsUTC(
									new Date(),
									windowConfig.hotWindowMonthsAhead,
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

							// Verify all files exist in MinIO BEFORE database insert
							await Promise.all(
								attachments.map(async (attachment, i) => {
									try {
										const stat = await ctx.minio.client.statObject(
											ctx.minio.bucketName,
											attachment.objectName,
										);

										const minioMimeType = stat.metaData?.["content-type"];

										if (
											minioMimeType &&
											minioMimeType !== attachment.mimeType
										) {
											throw new TalawaGraphQLError({
												extensions: {
													code: "invalid_arguments",
													issues: [
														{
															argumentPath: [
																"input",
																"attachments",
																i,
																"mimeType",
															],
															message: `Mime type "${attachment.mimeType}" does not match the file in storage ("${minioMimeType}").`,
														},
													],
												},
											});
										}
									} catch (error) {
										if (error instanceof TalawaGraphQLError) {
											throw error;
										}

										// Only treat NotFound as user error
										if (
											error instanceof Error &&
											(error.name === "NotFound" ||
												error.message.includes("Not Found") ||
												(error as { code?: string }).code === "NotFound")
										) {
											throw new TalawaGraphQLError({
												extensions: {
													code: "invalid_arguments",
													issues: [
														{
															argumentPath: [
																"input",
																"attachments",
																i,
																"objectName",
															],
															message:
																"File not found in storage. Please upload the file first.",
														},
													],
												},
											});
										}
										// For other errors, throw unexpected
										ctx.log.error(
											`Unexpected MinIO error: ${error instanceof Error ? error.message : String(error)}`,
										);
										throw new TalawaGraphQLError({
											extensions: {
												code: "unexpected",
											},
										});
									}
								}),
							);

							createdEventAttachments = await tx
								.insert(eventAttachmentsTable)
								.values(
									attachments.map((attachment) => ({
										creatorId: currentUserId,
										eventId: createdEvent.id,
										mimeType: attachment.mimeType,
										name: attachment.name,
										objectName: attachment.objectName,
									})),
								)
								.returning();
						}

						const finalEvent = Object.assign(createdEvent, {
							attachments: createdEventAttachments,
							allDay: createdEvent.allDay ?? false,
							isPublic: createdEvent.isPublic ?? false,
							isRegisterable: createdEvent.isRegisterable ?? false,
							isInviteOnly: createdEvent.isInviteOnly ?? false,
						});

						return finalEvent;
					},
				);

				// Notification enqueue runs AFTER the transaction commits (fire-and-forget).
				// If enqueue fails, DB changes are NOT rolled back. Document/ADR if this is a concern.
				// Track notification enqueue operation (after transaction commits)
				try {
					const notificationPayload = {
						eventId: createdEventResult.id,
						eventName: createdEventResult.name,
						organizationId: createdEventResult.organizationId,
						organizationName: existingOrganization.name,
						// For timed events use startAt; for all-day events use startDate at midnight UTC
						startDate: createdEventResult.startAt
							? createdEventResult.startAt.toISOString()
							: createdEventResult.startDate
								? `${createdEventResult.startDate}T00:00:00Z`
								: new Date().toISOString(),
						creatorName: currentUser.name,
					};

					if (ctx.perf) {
						const stopTiming = ctx.perf.start(
							"mutation:createEvent:notification:enqueue",
						);
						try {
							ctx.notification?.enqueueEventCreated(notificationPayload);
						} finally {
							if (stopTiming) {
								stopTiming();
							}
						}
					} else {
						ctx.notification?.enqueueEventCreated(notificationPayload);
					}
				} catch (error) {
					ctx.log.error({ error }, "Failed to enqueue event notification");
				}

				// Track notification flush operation
				try {
					if (ctx.perf) {
						await ctx.perf.time(
							"mutation:createEvent:notification:flush",
							async () => {
								await ctx.notification?.flush(ctx);
							},
						);
					} else {
						await ctx.notification?.flush(ctx);
					}
				} catch (error) {
					ctx.log.error(
						{ error },
						"Failed to flush notifications after event create",
					);
				}

				await runBestEffortInvalidation(
					[invalidateEntityLists(ctx.cache, "event")],
					"event",
					ctx.log,
				);

				return createdEventResult;
			},
		),
		type: Event,
	}),
);
