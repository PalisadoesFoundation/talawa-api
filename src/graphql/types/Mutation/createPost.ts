import { ulid } from "ulidx";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { postAttachmentsTable } from "~/src/drizzle/tables/postAttachments";
import { postsTable } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreatePostInput,
	mutationCreatePostInputSchema,
} from "~/src/graphql/inputs/MutationCreatePostInput";
import { notificationEventBus } from "~/src/graphql/types/Notification/EventBus/eventBus";
import { Post } from "~/src/graphql/types/Post/Post";
import { zParseOrThrow } from "~/src/graphql/validators/helpers";
import { getKeyPathsWithNonUndefinedValues } from "~/src/utilities/getKeyPathsWithNonUndefinedValues";
import envConfig from "~/src/utilities/graphqLimits";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationCreatePostArgumentsSchema = z.object({
	input: mutationCreatePostInputSchema,
});

builder.mutationField("createPost", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreatePostInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to create a post.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const parsedArgs = await zParseOrThrow(
				mutationCreatePostArgumentsSchema,
				args,
			);

			const currentUserId = ctx.currentClient.user.id;

			const [currentUser, existingOrganization] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
						name: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.organizationsTable.findFirst({
					columns: {
						countryCode: true,
						name: true,
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

			if (currentUser.role !== "administrator") {
				const currentUserOrganizationMembership =
					existingOrganization.membershipsWhereOrganization[0];

				if (currentUserOrganizationMembership === undefined) {
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

				if (currentUserOrganizationMembership.role !== "administrator") {
					const unauthorizedArgumentPaths = getKeyPathsWithNonUndefinedValues({
						keyPaths: [["input", "isPinned"]],
						object: parsedArgs,
					});

					if (unauthorizedArgumentPaths.length !== 0) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unauthorized_arguments",
								issues: unauthorizedArgumentPaths.map((argumentPath) => ({
									argumentPath,
								})),
							},
						});
					}
				}
			}

			return await ctx.drizzleClient.transaction(async (tx) => {
				const [createdPost] = await tx
					.insert(postsTable)
					.values({
						creatorId: currentUserId,
						caption: parsedArgs.input.caption,
						body: parsedArgs.input.body,
						pinnedAt:
							parsedArgs.input.isPinned === undefined ||
							parsedArgs.input.isPinned === false
								? undefined
								: new Date(),
						organizationId: parsedArgs.input.organizationId,
					})
					.returning();
				if (createdPost === undefined) {
					ctx.log.error(
						"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
					);
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				// Handle direct file upload
				let createdAttachment: typeof postAttachmentsTable.$inferSelect | null =
					null;
				if (isNotNullish(parsedArgs.input.attachment)) {
					const attachment = parsedArgs.input.attachment;
					const objectName = ulid();
					try {
						// Upload media file to MinIO
						await ctx.minio.client.putObject(
							ctx.minio.bucketName,
							objectName,
							attachment.createReadStream(),
							undefined,
							{
								"content-type": attachment.mimetype,
							},
						);
					} catch (error) {
						ctx.log.error(`Error uploading file to MinIO: ${error}`);
						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
						});
					}

					// Create attachment record
					const attachmentRecord = {
						creatorId: currentUserId,
						mimeType: attachment.mimetype,
						id: uuidv7(),
						name: attachment.filename,
						postId: createdPost.id,
						objectName: objectName,
						fileHash: ulid(), // Placeholder - no deduplication for direct uploads
					};

					const [attachmentResult] = await tx
						.insert(postAttachmentsTable)
						.values(attachmentRecord)
						.returning();

					if (attachmentResult) {
						createdAttachment = attachmentResult;
					} else {
						//remove MinIO object if DB insert fails
						await ctx.minio.client.removeObject(
							ctx.minio.bucketName,
							objectName,
						);
						// Log and throw error
						ctx.log.error(
							"Postgres insert operation for post attachment unexpectedly returned an empty array instead of throwing an error.",
						);
						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
						});
					}
				}

				const finalPost = Object.assign(createdPost, {
					attachments: createdAttachment ? [createdAttachment] : [],
				});

				notificationEventBus.emitPostCreated(
					{
						postId: createdPost.id,
						organizationId: parsedArgs.input.organizationId,
						authorName: currentUser.name || "Anonymous",
						organizationName: existingOrganization.name || "Organization",
						postCaption: parsedArgs.input.caption || "New post",
					},
					ctx,
				);

				return finalPost;
			});
		},
		type: Post,
	}),
);
