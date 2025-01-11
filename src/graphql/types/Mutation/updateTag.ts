import { eq } from "drizzle-orm";
import { z } from "zod";
import { tagsTable } from "~/src/drizzle/tables/tags";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateTagInput,
	mutationUpdateTagInputSchema,
} from "~/src/graphql/inputs/MutationUpdateTagInput";
import { Tag } from "~/src/graphql/types/Tag/Tag";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { isNotNullish } from "~/src/utilities/isNotNullish";

const mutationUpdateTagArgumentsSchema = z.object({
	input: mutationUpdateTagInputSchema,
});

builder.mutationField("updateTag", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateTagInput,
			}),
		},
		description: "Mutation field to update a tag.",
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
			} = mutationUpdateTagArgumentsSchema.safeParse(args);

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

			const [currentUser, existingTag] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.tagsTable.findFirst({
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

			if (existingTag === undefined) {
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

			if (isNotNullish(parsedArgs.input.folderId)) {
				const folderId = parsedArgs.input.folderId;

				const existingTagFolder =
					await ctx.drizzleClient.query.tagsTable.findFirst({
						columns: {
							organizationId: true,
						},
						where: (fields, operators) => operators.eq(fields.id, folderId),
					});

				if (existingTagFolder === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "folderId"],
								},
							],
						},
					});
				}

				if (existingTagFolder.organizationId !== existingTag.organizationId) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "folderId"],
									message:
										"This tag does not belong to the associated organization.",
								},
							],
						},
					});
				}
			}

			if (isNotNullish(parsedArgs.input.name)) {
				const name = parsedArgs.input.name;

				const existingTagWithName =
					await ctx.drizzleClient.query.tagsTable.findFirst({
						columns: {
							updaterId: true,
						},
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.name, name),
								operators.eq(fields.organizationId, existingTag.organizationId),
							),
					});

				if (existingTagWithName !== undefined) {
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
				existingTag.organization.membershipsWhereOrganization[0];

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

			const [updatedTag] = await ctx.drizzleClient
				.update(tagsTable)
				.set({
					folderId: parsedArgs.input.folderId,
					name: parsedArgs.input.name,
					updaterId: currentUserId,
				})
				.where(eq(tagsTable.id, parsedArgs.input.id))
				.returning();

			// Updated tag not being returned means that either it was deleted or its `id` column was changed by external entities before this update operation could take place.
			if (updatedTag === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return updatedTag;
		},
		type: Tag,
	}),
);
