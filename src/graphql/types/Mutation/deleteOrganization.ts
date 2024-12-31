import { eq } from "drizzle-orm";
import { z } from "zod";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteOrganizationInput,
	mutationDeleteOrganizationInputSchema,
} from "~/src/graphql/inputs/MutationDeleteOrganizationInput";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationDeleteOrganizationArgumentsSchema = z.object({
	input: mutationDeleteOrganizationInputSchema,
});

builder.mutationField("deleteOrganization", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationDeleteOrganizationInput,
			}),
		},
		description: "Mutation field to delete an organization.",
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
			} = mutationDeleteOrganizationArgumentsSchema.safeParse(args);

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
					columns: {
						avatarName: true,
					},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.id),
					with: {
						advertisementsWhereOrganization: {
							columns: {
								type: true,
							},
							with: {
								advertisementAttachmentsWhereAdvertisement: true,
							},
						},
						chatsWhereOrganization: {
							columns: {
								avatarName: true,
							},
						},
						eventsWhereOrganization: {
							columns: {
								startAt: true,
							},
							with: {
								eventAttachmentsWhereEvent: true,
							},
						},
						postsWhereOrganization: {
							columns: {
								pinnedAt: true,
							},
							with: {
								postAttachmentsWherePost: true,
							},
						},
						venuesWhereOrganization: {
							columns: {
								updatedAt: true,
							},
							with: {
								venueAttachmentsWhereVenue: true,
							},
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

			if (currentUser.role !== "administrator") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
					message: "You are not authorized to perform this action.",
				});
			}

			if (existingOrganization === undefined) {
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

			return await ctx.drizzleClient.transaction(async (tx) => {
				const [deletedOrganization] = await tx
					.delete(organizationsTable)
					.where(eq(organizationsTable.id, parsedArgs.input.id))
					.returning();

				// Deleted organization not being returned means that either it doesn't exist or it was deleted or its `id` column was changed by external entities before this delete operation could take place.
				if (deletedOrganization === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "id"],
								},
							],
						},
						message:
							"No associated resources found for the provided arguments.",
					});
				}

				const objectNames: string[] = [];

				if (existingOrganization.avatarName !== null) {
					objectNames.push(existingOrganization.avatarName);
				}

				for (const advertisement of existingOrganization.advertisementsWhereOrganization) {
					for (const attachment of advertisement.advertisementAttachmentsWhereAdvertisement) {
						objectNames.push(attachment.name);
					}
				}

				for (const chat of existingOrganization.chatsWhereOrganization) {
					if (chat.avatarName !== null) {
						objectNames.push(chat.avatarName);
					}
				}

				for (const event of existingOrganization.eventsWhereOrganization) {
					for (const attachment of event.eventAttachmentsWhereEvent) {
						objectNames.push(attachment.name);
					}
				}

				for (const post of existingOrganization.postsWhereOrganization) {
					for (const attachment of post.postAttachmentsWherePost) {
						objectNames.push(attachment.name);
					}
				}

				for (const venue of existingOrganization.venuesWhereOrganization) {
					for (const attachment of venue.venueAttachmentsWhereVenue) {
						objectNames.push(attachment.name);
					}
				}

				await ctx.minio.client.removeObjects(ctx.minio.bucketName, objectNames);

				return deletedOrganization;
			});
		},
		type: Organization,
	}),
);
