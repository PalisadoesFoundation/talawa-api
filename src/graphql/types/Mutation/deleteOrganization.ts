import { eq } from "drizzle-orm";
import { z } from "zod";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteOrganizationInput,
	mutationDeleteOrganizationInputSchema,
} from "~/src/graphql/inputs/MutationDeleteOrganizationInput";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { executeMutation } from "~/src/graphql/utils/withMutationMetrics";
import envConfig from "~/src/utilities/graphqLimits";
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
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to delete an organization.",
		resolve: async (_parent, args, ctx) => {
			return executeMutation("deleteOrganization", ctx, async () => {
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
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
					ctx.drizzleClient.query.organizationsTable.findFirst({
						columns: {
							avatarName: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, parsedArgs.input.id),
						with: {
							advertisementsWhereOrganization: {
								with: {
									attachmentsWhereAdvertisement: {
										columns: {
											name: true,
										},
									},
								},
							},
							chatsWhereOrganization: {
								columns: {
									avatarName: true,
								},
							},
							eventsWhereOrganization: {
								with: {
									attachmentsWhereEvent: {
										columns: {
											name: true,
										},
									},
								},
							},
							postsWhereOrganization: {
								with: {
									attachmentsWherePost: {
										columns: {
											name: true,
										},
									},
								},
							},
							venuesWhereOrganization: {
								with: {
									attachmentsWhereVenue: {
										columns: {
											name: true,
										},
									},
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

				// Collect object names before transaction (from existingOrganization query)
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

				// Perform DB delete inside transaction
				const deletedOrganization = await ctx.drizzleClient.transaction(
					async (tx) => {
						const [deleted] = await tx
							.delete(organizationsTable)
							.where(eq(organizationsTable.id, parsedArgs.input.id))
							.returning();

						// Deleted organization not being returned means that either it doesn't exist or it was deleted or its `id` column was changed by external entities before this delete operation could take place.
						if (deleted === undefined) {
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

						return deleted;
					},
				);

				// Delete MinIO objects after transaction commits to avoid long DB locks
				// and ensure DB deletion succeeded before attempting storage cleanup
				if (objectNames.length > 0) {
					try {
						await ctx.minio.client.removeObjects(
							ctx.minio.bucketName,
							objectNames,
						);
					} catch (error) {
						// Log error but don't fail the mutation - DB deletion already succeeded
						ctx.log.error(
							{ error, objectNames, organizationId: parsedArgs.input.id },
							"Failed to delete MinIO objects after organization deletion",
						);
					}
				}

				return deletedOrganization;
			});
		},
		type: Organization,
	}),
);
