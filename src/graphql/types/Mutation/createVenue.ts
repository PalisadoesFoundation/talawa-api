import type { FileUpload } from "graphql-upload-minimal";
import { ulid } from "ulidx";
import { z } from "zod";
import { venueAttachmentMimeTypeEnum } from "~/src/drizzle/enums/venueAttachmentMimeType";
import { venueAttachmentsTable } from "~/src/drizzle/tables/venueAttachments";
import { venuesTable } from "~/src/drizzle/tables/venues";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateVenueInput,
	mutationCreateVenueInputSchema,
} from "~/src/graphql/inputs/MutationCreateVenueInput";
import { Venue } from "~/src/graphql/types/Venue/Venue";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationCreateVenueArgumentsSchema = z.object({
	input: mutationCreateVenueInputSchema.transform(async (arg, ctx) => {
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
					// `issue.path[0]` would correspond to the numeric index of the attachment within `arg.attachments` array which contains the invalid mime type.
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

				if (parsedArgs.input.attachments !== undefined) {
					const attachments = parsedArgs.input.attachments;

					const createdVenueAttachments = await tx
						.insert(venueAttachmentsTable)
						.values(
							attachments.map((attachment) => ({
								creatorId: currentUserId,
								mimeType: attachment.mimetype,
								name: ulid(),
								venueId: createdVenue.id,
							})),
						)
						.returning();

					await Promise.all(
						createdVenueAttachments.map((attachment, index) => {
							if (attachments[index] !== undefined) {
								return ctx.minio.client.putObject(
									ctx.minio.bucketName,
									attachment.name,
									attachments[index].createReadStream(),
									undefined,
									{
										"content-type": attachment.mimeType,
									},
								);
							}
						}),
					);

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
