import { z } from "zod";
import { advertisementAttachmentsTable } from "~/src/drizzle/tables/advertisementAttachments";
import { advertisementsTable } from "~/src/drizzle/tables/advertisements";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateAdvertisementInput,
	mutationCreateAdvertisementInputSchema,
} from "~/src/graphql/inputs/MutationCreateAdvertisementInput";
import { Advertisement } from "~/src/graphql/types/Advertisement/Advertisement";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

export const mutationCreateAdvertisementArgumentsSchema = z.object({
	input: mutationCreateAdvertisementInputSchema,
});

builder.mutationField("createAdvertisement", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateAdvertisementInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to create an advertisement.",
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
			} = await mutationCreateAdvertisementArgumentsSchema.safeParseAsync(args);

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
						countryCode: true,
					},
					with: {
						advertisementsWhereOrganization: {
							columns: {
								type: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.name, parsedArgs.input.name),
						},
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

			const existingAdvertisementWithName =
				existingOrganization.advertisementsWhereOrganization[0];

			if (existingAdvertisementWithName !== undefined) {
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
				const [createdAdvertisement] = await tx
					.insert(advertisementsTable)
					.values({
						creatorId: currentUserId,
						description: parsedArgs.input.description,
						endAt: parsedArgs.input.endAt,
						name: parsedArgs.input.name,
						organizationId: parsedArgs.input.organizationId,
						startAt: parsedArgs.input.startAt,
						type: parsedArgs.input.type,
					})
					.returning();

				// Inserted advertisement not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
				if (createdAdvertisement === undefined) {
					ctx.log.error(
						"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				if (
					parsedArgs.input.attachments !== undefined &&
					parsedArgs.input.attachments.length > 0
				) {
					const attachments = parsedArgs.input.attachments;

					// Verify all files exist in MinIO before creating database records
					for (let i = 0; i < attachments.length; i++) {
						const attachment = attachments[i];
						if (attachment) {
							try {
								await ctx.minio.client.statObject(
									ctx.minio.bucketName,
									attachment.objectName,
								);
							} catch {
								throw new TalawaGraphQLError({
									extensions: {
										code: "invalid_arguments",
										issues: [
											{
												argumentPath: ["input", "attachments", i, "objectName"],
												message:
													"File not found in storage. Please upload the file first using the presigned URL.",
											},
										],
									},
								});
							}
						}
					}

					// Create attachment records using objectName from FileMetadataInput
					const createdAdvertisementAttachments = await tx
						.insert(advertisementAttachmentsTable)
						.values(
							attachments.map((attachment) => ({
								advertisementId: createdAdvertisement.id,
								creatorId: currentUserId,
								mimeType: attachment.mimeType,
								name: attachment.objectName,
							})),
						)
						.returning();

					return Object.assign(createdAdvertisement, {
						attachments: createdAdvertisementAttachments,
					});
				}

				return Object.assign(createdAdvertisement, {
					attachments: [],
				});
			});
		},
		type: Advertisement,
	}),
);
