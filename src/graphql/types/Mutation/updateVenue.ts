import { eq } from "drizzle-orm";
import { z } from "zod";
import { venuesTable } from "~/src/drizzle/tables/venues";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateVenueInput,
	mutationUpdateVenueInputSchema,
} from "~/src/graphql/inputs/MutationUpdateVenueInput";
import { Venue } from "~/src/graphql/types/Venue/Venue";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationUpdateVenueArgumentsSchema = z.object({
	input: mutationUpdateVenueInputSchema,
});

builder.mutationField("updateVenue", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateVenueInput,
			}),
		},
		description: "Mutation field to update a venue.",
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
				data: parsedArgs,
				error,
				success,
			} = mutationUpdateVenueArgumentsSchema.safeParse(args);

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

			const [currentUser, existingVenue] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.venuesTable.findFirst({
					columns: {
						organizationId: true,
					},
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
						venueAttachmentsWhereVenue: true,
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
					message: "Only authenticated users can perform this action.",
				});
			}

			if (existingVenue === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
					message: "No associated resources found for the provided arguments.",
				});
			}

			if (isNotNullish(parsedArgs.input.name)) {
				const name = parsedArgs.input.name;

				const existingVenueWithName =
					await ctx.drizzleClient.query.venuesTable.findFirst({
						columns: {
							organizationId: true,
						},
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.name, name),
								operators.eq(
									fields.organizationId,
									existingVenue.organizationId,
								),
							),
					});

				if (existingVenueWithName !== undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "name"],
									message: "This name is not available.",
								},
							],
						},
						message:
							"This action is forbidden on the resources associated to the provided arguments.",
					});
				}
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
								argumentPath: ["input", "id"],
							},
						],
					},
					message:
						"You are not authorized to perform this action on the resources associated to the provided arguments.",
				});
			}

			const [updatedVenue] = await ctx.drizzleClient
				.update(venuesTable)
				.set({
					description: parsedArgs.input.description,
					name: parsedArgs.input.name,
					updaterId: currentUserId,
				})
				.where(eq(venuesTable.id, parsedArgs.input.id))
				.returning();

			// Updated venue not being returned means that either it was deleted or its `id` column was changed by external entities before this update operation could take place.
			if (updatedVenue === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "Something went wrong. Please try again.",
				});
			}

			return Object.assign(updatedVenue, {
				attachments: existingVenue.venueAttachmentsWhereVenue,
			});
		},
		type: Venue,
	}),
);
