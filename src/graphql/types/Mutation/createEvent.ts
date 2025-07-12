import type { FileUpload } from "graphql-upload-minimal";
import { ulid } from "ulidx";
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
import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import {
	buildRRuleString,
	validateRecurrenceInput,
} from "~/src/utilities/recurringEventHelpers";

const mutationCreateEventArgumentsSchema = z.object({
	input: mutationCreateEventInputSchema.transform(async (arg, ctx) => {
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
								argumentPath: ["input", "organizationId"],
							},
						],
					},
				});
			}

			return await ctx.drizzleClient.transaction(async (tx) => {
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
						isRecurringTemplate: !!parsedArgs.input.recurrence,
						// For recurring events, these are null (template only)
						recurringEventId: null,
						instanceStartTime: null,
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

				// Handle recurring event: Create recurrence rule only (NO instance generation)
				if (parsedArgs.input.recurrence) {
					// Build RRULE string
					const rruleString = buildRRuleString(
						parsedArgs.input.recurrence,
						parsedArgs.input.startAt,
					);

					// Create recurrence rule (just the rule, no instances)
					const [createdRecurrenceRule] = await tx
						.insert(recurrenceRulesTable)
						.values({
							recurrenceRuleString: rruleString,
							frequency: parsedArgs.input.recurrence.frequency,
							interval: parsedArgs.input.recurrence.interval || 1,
							recurrenceStartDate: parsedArgs.input.startAt,
							recurrenceEndDate: parsedArgs.input.recurrence.endDate,
							count: parsedArgs.input.recurrence.count,
							// latestInstanceDate is now just used for tracking, not generation
							latestInstanceDate: parsedArgs.input.startAt,
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

					ctx.log.info(
						"Created recurring event template - instances will be generated on-demand",
						{
							baseEventId: createdEvent.id,
							recurrenceRuleId: createdRecurrenceRule.id,
							rruleString: rruleString,
						},
					);
				}

				// Handle attachments (same logic for both recurring and standalone events)
				if (parsedArgs.input.attachments !== undefined) {
					const attachments = parsedArgs.input.attachments;

					const createdEventAttachments = await tx
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
						}),
					);

					return Object.assign(createdEvent, {
						attachments: createdEventAttachments,
					});
				}

				return Object.assign(createdEvent, {
					attachments: [],
					allDay: createdEvent.allDay ?? false,
					isPublic: createdEvent.isPublic ?? false,
					isRegisterable: createdEvent.isRegisterable ?? false,
				});
			});
		},
		type: Event,
	}),
);
