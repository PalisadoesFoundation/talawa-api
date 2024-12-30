import { eq } from "drizzle-orm";
import { z } from "zod";
import { postsTable } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdatePostInput,
	mutationUpdatePostInputSchema,
} from "~/src/graphql/inputs/MutationUpdatePostInput";
import { Post } from "~/src/graphql/types/Post/Post";
import { getKeyPathsWithNonUndefinedValues } from "~/src/utilities/getKeyPathsWithNonUndefinedValues";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

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
		description: "Mutation field to update a post.",
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
					message: "Invalid arguments provided.",
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
						postAttachmentsWherePost: true,
						organization: {
							columns: {
								countryCode: true,
							},
							with: {
								organizationMembershipsWhereOrganization: {
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
					message: "Only authenticated users can perform this action.",
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
					message: "No associated resources found for the provided arguments.",
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
							message:
								"You are not authorized to perform this action with the provided arguments.",
						});
					}
				}
			} else {
				const currentUserOrganizationMembership =
					existingPost.organization.organizationMembershipsWhereOrganization[0];

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
						message:
							"You are not authorized to perform this action on the resources associated to the provided arguments.",
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
								message:
									"You are not authorized to perform this action with the provided arguments.",
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
							message:
								"You are not authorized to perform this action with the provided arguments.",
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
							message:
								"You are not authorized to perform this action on the resources associated to the provided arguments.",
						});
					}
				}
			}

			const [updatedPost] = await ctx.drizzleClient
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

			// Updated post not being returned means that either it was deleted or its `id` column was changed by external entities before this update operation could take place.
			if (updatedPost === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "Something went wrong. Please try again.",
				});
			}

			return Object.assign(updatedPost, {
				attachments: existingPost.postAttachmentsWherePost,
			});
		},
		type: Post,
	}),
);
