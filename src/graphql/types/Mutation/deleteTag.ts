import { eq } from "drizzle-orm";
import { z } from "zod";
import { tagsTable } from "~/src/drizzle/tables/tags";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteTagInput,
	mutationDeleteTagInputSchema,
} from "~/src/graphql/inputs/MutationDeleteTagInput";
import { Tag } from "~/src/graphql/types/Tag/Tag";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationDeleteTagArgumentsSchema = z.object({
	input: mutationDeleteTagInputSchema,
});

builder.mutationField("deleteTag", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationDeleteTagInput,
			}),
		},
		description: "Mutation field to delete a tag.",
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
			} = mutationDeleteTagArgumentsSchema.safeParse(args);

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
						updaterId: true,
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

			const [deletedTag] = await ctx.drizzleClient
				.delete(tagsTable)
				.where(eq(tagsTable.id, parsedArgs.input.id))
				.returning();

			// Deleted tag not being returned means that either it was deleted or its `id` column was changed by external entities before this delete operation could take place.
			if (deletedTag === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return deletedTag;
		},
		type: Tag,
	}),
);
