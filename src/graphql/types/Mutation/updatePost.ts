import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { postAttachmentsTable } from "~/src/drizzle/tables/postAttachments";
import { postsTable } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdatePostInput,
	mutationUpdatePostInputSchema,
} from "~/src/graphql/inputs/MutationUpdatePostInput";
import { Post } from "~/src/graphql/types/Post/Post";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { getKeyPathsWithNonUndefinedValues } from "~/src/utilities/getKeyPathsWithNonUndefinedValues";
import envConfig from "~/src/utilities/graphqLimits";

const mutationUpdatePostArgumentsSchema = z.object({
	input: mutationUpdatePostInputSchema,
});

builder.mutationField("updatePost", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdatePostInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to update a post.",
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
			} = mutationUpdatePostArgumentsSchema.safeParse(args);

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

			const [currentUser, existingPost] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.postsTable.findFirst({
					columns: {
						pinnedAt: true,
						creatorId: true,
					},
					with: {
						attachmentsWherePost: true,
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

			if (existingPost === undefined) {
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

			if (currentUser.role === "administrator") {
				if (currentUserId !== existingPost.creatorId) {
					const unauthorizedArgumentPaths = getKeyPathsWithNonUndefinedValues({
						keyPaths: [["input", "caption"]],
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
			} else {
				const currentUserOrganizationMembership =
					existingPost.organization.membershipsWhereOrganization[0];

				if (currentUserOrganizationMembership === undefined) {
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

				if (currentUserOrganizationMembership.role === "administrator") {
					if (currentUserId !== existingPost.creatorId) {
						const unauthorizedArgumentPaths = getKeyPathsWithNonUndefinedValues(
							{
								keyPaths: [["input", "caption"]],
								object: parsedArgs,
							},
						);

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
				} else {
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

					if (currentUserId !== existingPost.creatorId) {
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
				}
			}

			// ...existing code...

			// Replace the simple update with a transaction
			return await ctx.drizzleClient.transaction(async (tx) => {
				const [updatedPost] = await tx
					.update(postsTable)
					.set({
						caption: parsedArgs.input.caption,
						pinnedAt:
							parsedArgs.input.isPinned === undefined
								? undefined
								: parsedArgs.input.isPinned
									? existingPost.pinnedAt === null
										? new Date()
										: undefined
									: null,
						updaterId: currentUserId,
					})
					.where(eq(postsTable.id, parsedArgs.input.id))
					.returning();

				// Updated post not being returned means that either it was deleted or its `id` column was changed
				if (updatedPost === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				// Handle attachments if they're provided in the input
				if (parsedArgs.input.attachments !== undefined) {
					// First delete existing attachments
					await tx
						.delete(postAttachmentsTable)
						.where(eq(postAttachmentsTable.postId, updatedPost.id));

					// Then insert new attachments
					const attachments = parsedArgs.input.attachments;
					if (attachments.length > 0) {
						const createdPostAttachments = await tx
							.insert(postAttachmentsTable)
							.values(
								attachments.map((attachment) => ({
									updaterId: currentUserId,
									mimeType: attachment.mimetype,
									id: uuidv7(),
									name: attachment.name,
									postId: updatedPost.id,
									objectName: attachment.objectName,
									fileHash: attachment.fileHash,
								})),
							)
							.returning();

						return Object.assign(updatedPost, {
							attachments: createdPostAttachments,
						});
					}

					// Return empty attachments array if no new attachments
					return Object.assign(updatedPost, {
						attachments: [],
					});
				}

				// If attachments aren't part of the update, keep the existing ones
				return Object.assign(updatedPost, {
					attachments: existingPost.attachmentsWherePost,
				});
			});
		},
		type: Post,
	}),
);
