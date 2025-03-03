import { eq } from "drizzle-orm";
import type { FileUpload } from "graphql-upload-minimal";
import { ulid } from "ulidx";
import { z } from "zod";
import { advertisementAttachmentMimeTypeEnum } from "~/src/drizzle/enums/advertisementAttachmentMimeType";
import { advertisementAttachmentsTable } from "~/src/drizzle/schema";
import { advertisementsTable } from "~/src/drizzle/tables/advertisements";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateAdvertisementInput,
	mutationUpdateAdvertisementInputSchema,
} from "~/src/graphql/inputs/MutationUpdateAdvertisementInput";
import { Advertisement } from "~/src/graphql/types/Advertisement/Advertisement";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationUpdateAdvertisementArgumentsSchema = z.object({
	input: mutationUpdateAdvertisementInputSchema.transform(async (arg, ctx) => {
		let attachments:
			| (FileUpload & {
					mimetype: z.infer<typeof advertisementAttachmentMimeTypeEnum>;
			  })[]
			| undefined;
		if (arg.attachments !== undefined) {
			const rawAttachments = await Promise.all(arg.attachments);
			const { data, error, success } = advertisementAttachmentMimeTypeEnum
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

builder.mutationField("updateAdvertisement", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateAdvertisementInput,
			}),
		},
		description: "Mutation field to update an advertisement.",
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
			} = await mutationUpdateAdvertisementArgumentsSchema.safeParseAsync(args);

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
			const [currentUser, existingAdvertisement] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.advertisementsTable.findFirst({
					columns: {
						endAt: true,
						organizationId: true,
						startAt: true,
					},
					with: {
						attachmentsWhereAdvertisement: true,
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

			if (existingAdvertisement === undefined) {
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

			if (
				parsedArgs.input.endAt === undefined &&
				parsedArgs.input.startAt !== undefined &&
				existingAdvertisement.endAt <= parsedArgs.input.startAt
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "startAt"],
								message: `Must be smaller than the value: ${parsedArgs.input.startAt.toISOString()}`,
							},
						],
					},
				});
			}

			if (
				parsedArgs.input.endAt !== undefined &&
				parsedArgs.input.startAt === undefined &&
				parsedArgs.input.endAt <= existingAdvertisement.startAt
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "endAt"],
								message: `Must be greater than the value: ${parsedArgs.input.endAt.toISOString()}`,
							},
						],
					},
				});
			}

			if (parsedArgs.input.name !== undefined) {
				const name = parsedArgs.input.name;

				const existingAdvertisementWithName =
					await ctx.drizzleClient.query.advertisementsTable.findFirst({
						columns: {
							type: true,
						},
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.name, name),
								operators.eq(
									fields.organizationId,
									existingAdvertisement.organizationId,
								),
							),
					});

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
			}

			const currentUserOrganizationMembership =
				existingAdvertisement.organization.membershipsWhereOrganization[0];

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
			const [updatedAdvertisement] = await ctx.drizzleClient
				.update(advertisementsTable)
				.set({
					description: parsedArgs.input.description,
					endAt: parsedArgs.input.endAt,
					startAt: parsedArgs.input.startAt,
					name: parsedArgs.input.name,
					type: parsedArgs.input.type,
					updaterId: currentUserId,
				})
				.where(eq(advertisementsTable.id, parsedArgs.input.id))
				.returning();

			if (updatedAdvertisement === undefined) {
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
				const updatedAdvertisementAttachments = await ctx.drizzleClient
					.insert(advertisementAttachmentsTable)
					.values(
						attachments.map((attachment) => ({
							advertisementId: updatedAdvertisement.id,
							creatorId: currentUserId,
							mimeType: attachment.mimetype,
							name: ulid(),
						})),
					)
					.onConflictDoNothing()
					.returning();

				if (Array.isArray(updatedAdvertisementAttachments)) {
					await Promise.all(
						updatedAdvertisementAttachments.map((attachment, index) => {
							if (attachments[index] !== undefined) {
								return ctx.minio.client.putObject(
									ctx.minio.bucketName,
									attachment.name,
									attachments[index].createReadStream(),
									undefined,
									{
										"content-type": attachments[index].mimetype,
									},
								);
							}
						}),
					);
				}
			}
			return updatedAdvertisement as Advertisement;
		},
		type: Advertisement,
	}),
);
