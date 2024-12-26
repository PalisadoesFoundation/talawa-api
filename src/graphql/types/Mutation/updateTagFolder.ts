import { eq } from "drizzle-orm";
import { z } from "zod";
import { tagFoldersTable } from "~/src/drizzle/tables/tagFolders";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateTagFolderInput,
	mutationUpdateTagFolderInputSchema,
} from "~/src/graphql/inputs/MutationUpdateTagFolderInput";
import { TagFolder } from "~/src/graphql/types/TagFolder/TagFolder";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationUpdateTagFolderArgumentsSchema = z.object({
	input: mutationUpdateTagFolderInputSchema,
});

builder.mutationField("updateTagFolder", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateTagFolderInput,
			}),
		},
		description: "Mutation field to update a tag folder.",
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
			} = mutationUpdateTagFolderArgumentsSchema.safeParse(args);

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

			const [currentUser, existingTagFolder] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.tagFoldersTable.findFirst({
					columns: {
						organizationId: true,
					},
					with: {
						organization: {
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

			if (existingTagFolder === undefined) {
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

			if (isNotNullish(parsedArgs.input.parentFolderId)) {
				const parentFolderId = parsedArgs.input.parentFolderId;

				const existingParentFolder =
					await ctx.drizzleClient.query.tagFoldersTable.findFirst({
						columns: {
							organizationId: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, parentFolderId),
					});

				if (existingParentFolder === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "parentFolderId"],
								},
							],
						},
						message:
							"No associated resources found for the provided arguments.",
					});
				}

				if (
					existingParentFolder.organizationId !==
					existingTagFolder.organizationId
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "parentFolderId"],
									message:
										"This tag does not belong to the associated organization.",
								},
							],
						},
						message:
							"This action is forbidden on the resources associated to the provided arguments.",
					});
				}
			}

			const currentUserOrganizationMembership =
				existingTagFolder.organization
					.organizationMembershipsWhereOrganization[0];

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
					message:
						"You are not authorized to perform this action on the resources associated to the provided arguments.",
				});
			}

			const [updatedTagFolder] = await ctx.drizzleClient
				.update(tagFoldersTable)
				.set({
					name: parsedArgs.input.name,
					parentFolderId: parsedArgs.input.parentFolderId,
					updaterId: currentUserId,
				})
				.where(eq(tagFoldersTable.id, parsedArgs.input.id))
				.returning();

			// Updated tag folder not being returned means that either it was deleted or its `id` column was changed by external entities before this update operation could take place.
			if (updatedTagFolder === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "Something went wrong. Please try again.",
				});
			}

			return updatedTagFolder;
		},
		type: TagFolder,
	}),
);
