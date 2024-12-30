import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { venueBookingsTable } from "~/src/drizzle/tables/venueBookings";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteVenueBookingInput,
	mutationDeleteVenueBookingInputSchema,
} from "~/src/graphql/inputs/MutationDeleteVenueBookingInput";
import { Venue } from "~/src/graphql/types/Venue/Venue";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationDeleteVenueBookingArgumentsSchema = z.object({
	input: mutationDeleteVenueBookingInputSchema,
});

builder.mutationField("deleteVenueBooking", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationDeleteVenueBookingInput,
			}),
		},
		description: "Mutation field to delete an venue booking.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
					message: "Only authenticated users can perform this action.",
				});
			}

			const {
				success,
				data: parsedArgs,
				error,
			} = mutationDeleteVenueBookingArgumentsSchema.safeParse(args);

			if (!success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: error.issues.map((issue) => ({
							argumentPath: issue.path,
							message: issue.message,
						})),
					},
					message: "Invalid arguments provided.",
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
					columns: {},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.eventId),
				}),
				ctx.drizzleClient.query.venuesTable.findFirst({
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.venueId),
					with: {
						organization: {
							columns: {},
							with: {
								organizationMembershipsWhereOrganization: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.memberId, currentUserId),
								},
							},
						},
						venueBookingsWhereVenue: {
							columns: {},
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
					message: "Only authenticated users can perform this action.",
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
					message: "No associated resources found for the provided arguments.",
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
					message: "No associated resources found for the provided arguments.",
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
					message: "No associated resources found for the provided arguments.",
				});
			}

			const existingVenueBooking = existingVenue.venueBookingsWhereVenue[0];

			if (existingVenueBooking === undefined) {
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
					message: "No associated resources found for the provided arguments.",
				});
			}

			const currentUserOrganizationMembership =
				existingVenue.organization.organizationMembershipsWhereOrganization[0];

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
					message:
						"You are not authorized to perform this action on the resources associated to the provided arguments.",
				});
			}

			const [deletedVenueBooking] = await ctx.drizzleClient
				.delete(venueBookingsTable)
				.where(
					and(
						eq(venueBookingsTable.eventId, parsedArgs.input.eventId),
						eq(venueBookingsTable.venueId, parsedArgs.input.venueId),
					),
				)
				.returning();

			// Deleted venue booking not being returned means that either it was deleted or its `event_id` column or `venue_id` column or both were changed by external entities before this delete operation could take place.
			if (deletedVenueBooking === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "Something went wrong. Please try again.",
				});
			}

			return existingVenue;
		},
		type: Venue,
	}),
);
