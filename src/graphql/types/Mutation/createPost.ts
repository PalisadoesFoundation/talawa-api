import { ulid } from "ulidx";
import { z } from "zod";
import { postAttachmentsTable } from "~/src/drizzle/tables/postAttachments";
import { postsTable } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreatePostInput,
	mutationCreatePostInputSchema,
} from "~/src/graphql/inputs/MutationCreatePostInput";
import { Post } from "~/src/graphql/types/Post/Post";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { getKeyPathsWithNonUndefinedValues } from "~/src/utilities/getKeyPathsWithNonUndefinedValues";

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
		description: "Mutation field to create a post.",
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
			} = await mutationCreatePostArgumentsSchema.safeParseAsync(args);

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

				if (parsedArgs.input.attachments !== undefined) {
					const attachments = parsedArgs.input.attachments;

					const createdPostAttachments = await tx
						.insert(postAttachmentsTable)
						.values(
							attachments.map((attachment) => ({
								creatorId: currentUserId,
								mimeType: attachment.mimetype,
								name: ulid(),
								postId: createdPost.id,
								objectName: attachment.objectName,
								fileHash: attachment.fileHash,
							})),
						)
						.returning();

					return Object.assign(createdPost, {
						attachments: createdPostAttachments,
					});
				}

				return Object.assign(createdPost, {
					attachments: [],
				});
			});
		},
		type: Post,
	}),
);
