import { z } from "zod";
import { postAttachmentsTable } from "~/src/drizzle/tables/postAttachments";
import { postsTable } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreatePostInput,
	mutationCreatePostInputSchema,
} from "~/src/graphql/inputs/MutationCreatePostInput";
import { Post } from "~/src/graphql/types/Post/Post";
import { getKeyPathsWithNonUndefinedValues } from "~/src/utilities/getKeyPathsWithNonUndefinedValues";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

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
					message: "Only authenticated users can perform this action.",
				});
			}

			const {
				data: parsedArgs,
				error,
				success,
			} = mutationCreatePostArgumentsSchema.safeParse(args);

			if (!success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: error.issues.map((issue) => ({
							argumentPath: issue.path,
							message: issue.message,
						})),
					},
					message: "Invalid arguments provided.",
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
					columns: {},
					with: {
						organizationMembershipsWhereOrganization: {
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
					message: "Only authenticated users can perform this action.",
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
					message: "No associated resources found for the provided arguments.",
				});
			}

			if (currentUser.role !== "administrator") {
				const currentUserOrganizationMembership =
					existingOrganization.organizationMembershipsWhereOrganization[0];

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
						message:
							"You are not authorized to perform this action on the resources associated to the provided arguments.",
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
							message:
								"You are not authorized to perform this action with the provided arguments.",
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

				// Inserted post not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
				if (createdPost === undefined) {
					ctx.log.error(
						"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
					);
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
						message: "Something went wrong. Please try again.",
					});
				}

				if (parsedArgs.input.attachments !== undefined) {
					const createdPostAttachments = await tx
						.insert(postAttachmentsTable)
						.values(
							parsedArgs.input.attachments.map((attachment) => ({
								creatorId: currentUserId,
								postId: createdPost.id,
								type: attachment.type,
								uri: attachment.uri,
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
