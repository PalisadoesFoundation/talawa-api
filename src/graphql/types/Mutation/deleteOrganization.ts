import { eq } from "drizzle-orm";
import { z } from "zod";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteOrganizationInput,
	mutationDeleteOrganizationInputSchema,
} from "~/src/graphql/inputs/MutationDeleteOrganizationInput";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

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
								attachmentsWhereAdvertisement: true,
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
								attachmentsWhereEvent: true,
							},
						},
						postsWhereOrganization: {
							columns: {
								pinnedAt: true,
							},
							with: {
								attachmentsWherePost: true,
							},
						},
						venuesWhereOrganization: {
							columns: {
								updatedAt: true,
							},
							with: {
								attachmentsWhereVenue: true,
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
				});
			}

			if (currentUser.role !== "administrator") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
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
					});
				}

				const objectNames: string[] = [];

				if (existingOrganization.avatarName !== null) {
					objectNames.push(existingOrganization.avatarName);
				}

				for (const advertisement of existingOrganization.advertisementsWhereOrganization) {
					for (const attachment of advertisement.attachmentsWhereAdvertisement) {
						objectNames.push(attachment.name);
					}
				}

				for (const chat of existingOrganization.chatsWhereOrganization) {
					if (chat.avatarName !== null) {
						objectNames.push(chat.avatarName);
					}
				}

				for (const event of existingOrganization.eventsWhereOrganization) {
					for (const attachment of event.attachmentsWhereEvent) {
						objectNames.push(attachment.name);
					}
				}

				for (const post of existingOrganization.postsWhereOrganization) {
					for (const attachment of post.attachmentsWherePost) {
						objectNames.push(attachment.name);
					}
				}

				for (const venue of existingOrganization.venuesWhereOrganization) {
					for (const attachment of venue.attachmentsWhereVenue) {
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
