import { eq } from "drizzle-orm";
import type { FileUpload } from "graphql-upload-minimal";
import { ulid } from "ulidx";
import { z } from "zod";
import { venueAttachmentMimeTypeEnum } from "~/src/drizzle/enums/venueAttachmentMimeType";
import { venueAttachmentsTable } from "~/src/drizzle/tables/venueAttachments";
import { venuesTable } from "~/src/drizzle/tables/venues";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateVenueInput,
	mutationUpdateVenueInputSchema,
} from "~/src/graphql/inputs/MutationUpdateVenueInput";
import { Venue } from "~/src/graphql/types/Venue/Venue";
import envConfig from "~/src/utilities/graphqLimits";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationUpdateVenueArgumentsSchema = z.object({
	input: mutationUpdateVenueInputSchema.transform(async (arg, ctx) => {
		let attachments:
			| (FileUpload & {
					mimetype: z.infer<typeof venueAttachmentMimeTypeEnum>;
			  })[]
			| undefined;

		if (arg.attachments !== undefined) {
			const rawAttachments = await Promise.all(arg.attachments);
			const { data, error, success } = venueAttachmentMimeTypeEnum
				.array()
				.safeParse(rawAttachments.map((attachment) => attachment.mimetype));

			if (!success) {
				for (const issue of error.issues) {
					if (typeof issue.path[0] === "number") {
						ctx.addIssue({
							code: "custom",
							path: ["attachments", issue.path[0]],
							message: `Mime type "${rawAttachments[issue.path[0]]?.mimetype}" is not allowed.`,
						});
					}
				}
			} else {
				attachments = rawAttachments.map((attachment, index) =>
					Object.assign(attachment, {
						mimetype: data[index],
					}),
				);
			}
		}

		return {
			...arg,
			attachments,
		};
	}),
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
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to update a venue.",
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
			} = await mutationUpdateVenueArgumentsSchema.safeParseAsync(args);

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
				});
			}

			if (isNotNullish(parsedArgs.input.name)) {
				const name = parsedArgs.input.name;

				const existingVenueWithName =
					await ctx.drizzleClient.query.venuesTable.findFirst({
						columns: {
							updatedAt: true,
						},
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.name, name),
								operators.eq(
									fields.organizationId,
									existingVenue.organizationId,
								),
								operators.ne(fields.id, parsedArgs.input.id),
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
					});
				}
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
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			return await ctx.drizzleClient.transaction(async (tx) => {
				const [updatedVenue] = await tx
					.update(venuesTable)
					.set({
						description: parsedArgs.input.description,
						name: parsedArgs.input.name,
						updaterId: currentUserId,
						capacity: parsedArgs.input.capacity,
					})
					.where(eq(venuesTable.id, parsedArgs.input.id))
					.returning();

				// Updated venue not being returned means that either it was deleted or its `id` column was changed by external entities before this update operation could take place.
				if (updatedVenue === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				// Handle attachment updates
				if (parsedArgs.input.attachments !== undefined) {
					const attachments = parsedArgs.input.attachments;

					// Delete existing attachment records (files will be removed after commit)
					const existingAttachments = existingVenue.attachmentsWhereVenue;
					if (existingAttachments.length > 0) {
						await tx
							.delete(venueAttachmentsTable)
							.where(eq(venueAttachmentsTable.venueId, parsedArgs.input.id));
					}

					// Create new attachments
					const createdVenueAttachments = await tx
						.insert(venueAttachmentsTable)
						.values(
							attachments.map((attachment) => ({
								creatorId: currentUserId,
								mimeType: attachment.mimetype,
								name: ulid(),
								venueId: updatedVenue.id,
							})),
						)
						.returning();

					// Upload new files to MinIO
					const uploaded: string[] = [];
					try {
						await Promise.all(
							createdVenueAttachments.map(async (attachment, index) => {
								const file = attachments[index];
								if (file) {
									await ctx.minio.client.putObject(
										ctx.minio.bucketName,
										attachment.name,
										file.createReadStream(),
										undefined,
										{ "content-type": attachment.mimeType },
									);
									uploaded.push(attachment.name);
								}
							}),
						);
					} catch (e) {
						// Best-effort cleanup of partially uploaded files
						await Promise.all(
							uploaded.map((name) =>
								ctx.minio.client.removeObject(ctx.minio.bucketName, name),
							),
						);
						if (e instanceof TalawaGraphQLError) {
							throw e;
						}
						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
						});
					}

					return Object.assign(updatedVenue, {
						attachments: createdVenueAttachments,
					});
				}

				return Object.assign(updatedVenue, {
					attachments: existingVenue.attachmentsWhereVenue,
				});
			});
		},
		type: Venue,
	}),
);
