import { z } from "zod";
import { venueAttachmentsTable } from "~/src/drizzle/tables/venueAttachments";
import { venuesTable } from "~/src/drizzle/tables/venues";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateVenueInput,
	mutationCreateVenueInputSchema,
} from "~/src/graphql/inputs/MutationCreateVenueInput";
import { Venue } from "~/src/graphql/types/Venue/Venue";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationCreateVenueArgumentsSchema = z.object({
	input: mutationCreateVenueInputSchema,
});

builder.mutationField("createVenue", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateVenueInput,
			}),
		},
		description: "Mutation field to create a venue.",
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
			} = mutationCreateVenueArgumentsSchema.safeParse(args);

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

			const [currentUser, existingOrganization] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.organizationsTable.findFirst({
					columns: {},
					with: {
						organizationMembershipsWhereOrganization: {
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.memberId, currentUserId),
						},
						venuesWhereOrganization: {
							columns: {},
							where: (fields, operators) =>
								operators.eq(fields.name, parsedArgs.input.name),
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
					message: "Only authenticated users can perform this action.",
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
					message: "No associated resources found for the provided arguments.",
				});
			}

			const existingVenueWithName =
				existingOrganization.venuesWhereOrganization[0];

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

			const currentUserOrganizationMembership =
				existingOrganization.organizationMembershipsWhereOrganization[0];

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
					message:
						"You are not authorized to perform this action on the resources associated to the provided arguments.",
				});
			}

			return ctx.drizzleClient.transaction(async (tx) => {
				const [createdVenue] = await tx
					.insert(venuesTable)
					.values({
						creatorId: currentUserId,
						description: parsedArgs.input.description,
						name: parsedArgs.input.name,
						organizationId: parsedArgs.input.organizationId,
					})
					.returning();

				// Inserted venue not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
				if (createdVenue === undefined) {
					ctx.log.error(
						"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
						message: "Something went wrong. Please try again.",
					});
				}

				if (parsedArgs.input.attachments !== undefined) {
					const createdVenueAttachments = await tx
						.insert(venueAttachmentsTable)
						.values(
							parsedArgs.input.attachments.map((attachment) => ({
								creatorId: currentUserId,
								type: attachment.type,
								uri: attachment.uri,
								venueId: createdVenue.id,
							})),
						)
						.returning();

					return Object.assign(createdVenue, {
						attachments: createdVenueAttachments,
					});
				}

				return Object.assign(createdVenue, {
					attachments: [],
				});
			});
		},
		type: Venue,
	}),
);
