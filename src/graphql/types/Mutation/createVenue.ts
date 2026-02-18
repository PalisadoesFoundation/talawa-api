import { z } from "zod";
import { venueAttachmentsTable } from "~/src/drizzle/tables/venueAttachments";
import { venuesTable } from "~/src/drizzle/tables/venues";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateVenueInput,
	mutationCreateVenueInputSchema,
} from "~/src/graphql/inputs/MutationCreateVenueInput";
import { Venue } from "~/src/graphql/types/Venue/Venue";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

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
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to create a venue.",
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
			} = await mutationCreateVenueArgumentsSchema.safeParseAsync(args);

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
						membershipsWhereOrganization: {
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.memberId, currentUserId),
						},
						venuesWhereOrganization: {
							columns: {
								updatedAt: true,
							},
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
				const [createdVenue] = await tx
					.insert(venuesTable)
					.values({
						creatorId: currentUserId,
						description: parsedArgs.input.description,
						name: parsedArgs.input.name,
						organizationId: parsedArgs.input.organizationId,
						capacity: parsedArgs.input.capacity,
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
					});
				}

				if (parsedArgs.input.attachments?.length) {
					const attachments = parsedArgs.input.attachments;

					// Verify all files exist in MinIO in parallel before creating database records
					await Promise.all(
						attachments.map(async (attachment, i) => {
							try {
								await ctx.minio.client.statObject(
									ctx.minio.bucketName,
									attachment.objectName,
								);
							} catch (error) {
								// Only treat NotFound as user error
								if (
									error instanceof Error &&
									(error.name === "NotFound" ||
										error.message.includes("Not Found") ||
										(error as { code?: string }).code === "NotFound")
								) {
									throw new TalawaGraphQLError({
										extensions: {
											code: "invalid_arguments",
											issues: [
												{
													argumentPath: [
														"input",
														"attachments",
														i,
														"objectName",
													],
													message:
														"File not found in storage. Please upload the file first.",
												},
											],
										},
									});
								}
								// For other errors, throw unexpected
								ctx.log.error(
									`Unexpected MinIO error: ${error instanceof Error ? error.message : String(error)}`,
								);
								throw new TalawaGraphQLError({
									extensions: {
										code: "unexpected",
									},
								});
							}
						}),
					);

					// Create attachment records using name from FileMetadataInput (original filename)
					const createdVenueAttachments = await tx
						.insert(venueAttachmentsTable)
						.values(
							attachments.map((attachment) => ({
								creatorId: currentUserId,
								mimeType: attachment.mimeType,
								name: attachment.name,
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
