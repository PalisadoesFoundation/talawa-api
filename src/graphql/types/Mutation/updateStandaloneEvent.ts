import { eq } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateEventInput,
	mutationUpdateEventInputSchema,
} from "~/src/graphql/inputs/MutationUpdateEventInput";
import { Event } from "~/src/graphql/types/Event/Event";
import { runBestEffortInvalidation } from "~/src/graphql/utils/runBestEffortInvalidation";
import {
	invalidateEntity,
	invalidateEntityLists,
} from "~/src/services/caching/invalidation";
import envConfig from "~/src/utilities/graphqLimits";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationUpdateStandaloneEventArgumentsSchema = z.object({
	input: mutationUpdateEventInputSchema,
});

builder.mutationField("updateStandaloneEvent", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input for updating a standalone event.",
				required: true,
				type: MutationUpdateEventInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to update a standalone (non-recurring) event.",
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
			} = mutationUpdateStandaloneEventArgumentsSchema.safeParse(args);

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

			const [currentUser, existingEvent] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.eventsTable.findFirst({
					columns: {
						endAt: true,
						endDate: true,
						organizationId: true,
						startAt: true,
						startDate: true,
						allDay: true,
						isPublic: true,
						isRegisterable: true,
						isInviteOnly: true,
						location: true,
						creatorId: true,
					},
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
						operators.eq(fields.id, parsedArgs.input.id),
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
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			// For timed events: validate that updated endAt doesn't precede existing startAt
			if (
				isNotNullish(parsedArgs.input.endAt) &&
				!isNotNullish(parsedArgs.input.startAt) &&
				existingEvent.startAt &&
				parsedArgs.input.endAt <= existingEvent.startAt
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "endAt"],
								message: "End time must be after start time.",
							},
						],
					},
				});
			}

			// For timed events: validate that updated startAt doesn't exceed existing endAt
			if (
				!isNotNullish(parsedArgs.input.endAt) &&
				isNotNullish(parsedArgs.input.startAt) &&
				existingEvent.endAt &&
				parsedArgs.input.startAt >= existingEvent.endAt
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "startAt"],
								message: "Start time must be before end time.",
							},
						],
					},
				});
			}

			// For all-day events: validate that updated endDate doesn't precede existing startDate
			if (
				isNotNullish(parsedArgs.input.endDate) &&
				!isNotNullish(parsedArgs.input.startDate) &&
				existingEvent.startDate &&
				parsedArgs.input.endDate <= existingEvent.startDate
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "endDate"],
								message: "End date must be after start date for all-day events.",
							},
						],
					},
				});
			}

			// For all-day events: validate that updated startDate doesn't exceed existing endDate
			if (
				!isNotNullish(parsedArgs.input.endDate) &&
				isNotNullish(parsedArgs.input.startDate) &&
				existingEvent.endDate &&
				parsedArgs.input.startDate >= existingEvent.endDate
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "startDate"],
								message: "Start date must be before end date for all-day events.",
							},
						],
					},
				});
			}

			const currentUserOrganizationMembership =
				existingEvent.organization.membershipsWhereOrganization[0];

			if (
				(currentUserOrganizationMembership === undefined ||
					currentUserOrganizationMembership.role !== "administrator") &&
				existingEvent.creatorId !== currentUserId
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

			// Build update object with only explicitly provided fields
			const updateData: Partial<typeof eventsTable.$inferInsert> = {
				updaterId: currentUserId,
			};

			if (parsedArgs.input.description !== undefined) {
				updateData.description = parsedArgs.input.description;
			}
			if (parsedArgs.input.name !== undefined) {
				updateData.name = parsedArgs.input.name;
			}
			if (parsedArgs.input.location !== undefined) {
				updateData.location = parsedArgs.input.location;
			}

			// Handle event type changes (only if explicitly provided)
			if (parsedArgs.input.allDay !== undefined) {
				updateData.allDay = parsedArgs.input.allDay;
				// When switching event type, clear the opposing fields
				if (parsedArgs.input.allDay === true) {
					updateData.startAt = null;
					updateData.endAt = null;
				} else {
					updateData.startDate = null;
					updateData.endDate = null;
				}
			}

			// Determine the effective event type (explicit update or preserve existing)
			const effectiveAllDay =
				parsedArgs.input.allDay !== undefined
					? parsedArgs.input.allDay
					: existingEvent.allDay;

			// Validate that correct date/time fields are provided for event type
			if (effectiveAllDay === true) {
				// All-day events require startDate and endDate
				if (
					parsedArgs.input.allDay === true ||
					parsedArgs.input.startDate !== undefined ||
					parsedArgs.input.endDate !== undefined
				) {
					// If explicitly setting to all-day or providing date fields, validate
					if (
						parsedArgs.input.startDate === undefined &&
						parsedArgs.input.endDate === undefined
					) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues: [
									{
										argumentPath: ["input"],
										message:
											"All-day events require startDate and endDate fields, not startAt/endAt",
									},
								],
							},
						});
					}
				}
			} else {
				// Timed events require startAt and endAt
				if (
					parsedArgs.input.allDay === false ||
					parsedArgs.input.startAt !== undefined ||
					parsedArgs.input.endAt !== undefined
				) {
					// If explicitly setting to timed or providing timestamp fields, validate
					if (
						parsedArgs.input.startAt === undefined &&
						parsedArgs.input.endAt === undefined
					) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues: [
									{
										argumentPath: ["input"],
										message:
											"Timed events require startAt and endAt fields, not startDate/endDate",
									},
								],
							},
						});
					}
				}
			}

			// Set date/time fields based on event type
			if (effectiveAllDay === true) {
				// All-day event: only set date fields
				if (parsedArgs.input.startDate !== undefined) {
					updateData.startDate = parsedArgs.input.startDate;
				}
				if (parsedArgs.input.endDate !== undefined) {
					updateData.endDate = parsedArgs.input.endDate;
				}
			} else {
				// Timed event: only set timestamp fields
				if (parsedArgs.input.startAt !== undefined) {
					updateData.startAt = parsedArgs.input.startAt;
				}
				if (parsedArgs.input.endAt !== undefined) {
					updateData.endAt = parsedArgs.input.endAt;
				}
			}

			if (parsedArgs.input.isPublic !== undefined) {
				updateData.isPublic = parsedArgs.input.isPublic;
			}
			if (parsedArgs.input.isRegisterable !== undefined) {
				updateData.isRegisterable = parsedArgs.input.isRegisterable;
			}
			if (parsedArgs.input.isInviteOnly !== undefined) {
				updateData.isInviteOnly = parsedArgs.input.isInviteOnly;
			}

			// Validate final event visibility state after update
			const finalIsPublic =
				parsedArgs.input.isPublic ?? existingEvent.isPublic ?? false;
			const finalIsInviteOnly =
				parsedArgs.input.isInviteOnly ?? existingEvent.isInviteOnly ?? false;

			if (finalIsPublic === true && finalIsInviteOnly === true) {
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

			const [updatedEvent] = await ctx.drizzleClient
				.update(eventsTable)
				.set(updateData)
				.where(eq(eventsTable.id, parsedArgs.input.id))
				.returning();

			// Updated event not being returned means that either it was deleted or its `id` column was changed by external entities before this update operation could take place.
			if (updatedEvent === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			await runBestEffortInvalidation(
				[
					invalidateEntity(ctx.cache, "event", parsedArgs.input.id),
					invalidateEntityLists(ctx.cache, "event"),
				],
				"event",
				ctx.log,
			);

			return Object.assign(updatedEvent, {
				attachments: existingEvent.attachmentsWhereEvent,
			});
		},
		type: Event,
	}),
);
