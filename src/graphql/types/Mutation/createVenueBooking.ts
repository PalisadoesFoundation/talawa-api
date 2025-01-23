import { z } from "zod";
import { venueBookingsTable } from "~/src/drizzle/tables/venueBookings";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateVenueBookingInput,
	mutationCreateVenueBookingInputSchema,
} from "~/src/graphql/inputs/MutationCreateVenueBookingInput";
import { Venue } from "~/src/graphql/types/Venue/Venue";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationCreateVenueBookingArgumentsSchema = z.object({
	input: mutationCreateVenueBookingInputSchema,
});

builder.mutationField("createVenueBooking", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateVenueBookingInput,
			}),
		},
		description: "Mutation field to create a venue booking.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const {
				success,
				data: parsedArgs,
				error,
			} = mutationCreateVenueBookingArgumentsSchema.safeParse(args);

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

			const [currentUser, existingEvent, existingVenue] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.eventsTable.findFirst({
					columns: {
						startAt: true,
					},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.eventId),
				}),
				ctx.drizzleClient.query.venuesTable.findFirst({
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.venueId),
					with: {
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
						attachmentsWhereVenue: true,
						venueBookingsWhereVenue: {
							columns: {
								creatorId: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.eventId, parsedArgs.input.eventId),
						},
					},
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (existingEvent === undefined && existingVenue === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "eventId"],
							},
							{
								argumentPath: ["input", "venueId"],
							},
						],
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

			if (existingVenue === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "venueId"],
							},
						],
					},
				});
			}

			const existingVenueBooking = existingVenue.venueBookingsWhereVenue[0];

			if (existingVenueBooking !== undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "eventId"],
								message: "This event has already the venue booked for it.",
							},
							{
								argumentPath: ["input", "venueId"],
								message: "This venue is already booked for the event.",
							},
						],
					},
				});
			}

			const currentUserOrganizationMembership =
				existingVenue.organization.membershipsWhereOrganization[0];

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
							{
								argumentPath: ["input", "venueId"],
							},
						],
					},
				});
			}

			const [createdVenueBooking] = await ctx.drizzleClient
				.insert(venueBookingsTable)
				.values({
					creatorId: currentUserId,
					eventId: parsedArgs.input.eventId,
					venueId: parsedArgs.input.venueId,
				})
				.returning();

			// Inserted venue booking not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
			if (createdVenueBooking === undefined) {
				ctx.log.error(
					"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
				);

				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return Object.assign(existingVenue, {
				attachments: existingVenue.attachmentsWhereVenue,
			});
		},
		type: Venue,
	}),
);
