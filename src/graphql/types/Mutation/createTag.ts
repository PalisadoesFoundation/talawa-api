import { z } from "zod";
import { tagsTable } from "~/src/drizzle/tables/tags";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateTagInput,
	mutationCreateTagInputSchema,
} from "~/src/graphql/inputs/MutationCreateTagInput";
import { Tag } from "~/src/graphql/types/Tag/Tag";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationCreateTagArgumentsSchema = z.object({
	input: mutationCreateTagInputSchema,
});

builder.mutationField("createTag", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateTagInput,
			}),
		},
		description: "Mutation field to create a tag.",
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
			} = mutationCreateTagArgumentsSchema.safeParse(args);

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

			const [currentUser, existingOrganization, existingTag] =
				await Promise.all([
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
					ctx.drizzleClient.query.organizationsTable.findFirst({
						columns: {},
						with: {
							organizationMembershipsWhereOrganization: {
								where: (fields, operators) =>
									operators.eq(fields.memberId, currentUserId),
							},
						},
						where: (fields, operators) =>
							operators.eq(fields.id, parsedArgs.input.organizationId),
					}),
					ctx.drizzleClient.query.tagsTable.findFirst({
						columns: {},
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.isFolder, parsedArgs.input.isFolder),
								operators.eq(fields.name, parsedArgs.input.name),
								operators.eq(
									fields.organizationId,
									parsedArgs.input.organizationId,
								),
							),
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

			if (existingTag !== undefined) {
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
					message:
						"This action is forbidden on the resources associated to the provided arguments.",
				});
			}

			if (isNotNullish(parsedArgs.input.parentTagId)) {
				const parentTagId = parsedArgs.input.parentTagId;

				const existingParentTag =
					await ctx.drizzleClient.query.tagsTable.findFirst({
						columns: {
							isFolder: true,
							organizationId: true,
						},
						where: (fields, operators) => operators.eq(fields.id, parentTagId),
					});

				if (existingParentTag === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "parentTagId"],
								},
							],
						},
						message:
							"No associated resources found for the provided arguments.",
					});
				}

				if (
					existingParentTag.organizationId !== parsedArgs.input.organizationId
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "parentTagId"],
									message:
										"This tag does not belong to the associated organization.",
								},
							],
						},
						message:
							"This action is forbidden on the resources associated to the provided arguments.",
					});
				}

				if (existingParentTag.isFolder !== true) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "parentTagId"],
									message: "This must be a tag folder.",
								},
							],
						},
						message:
							"This action is forbidden on the resources associated to the provided arguments.",
					});
				}
			}

			const currentUserOrganizationMembership =
				existingOrganization.organizationMembershipsWhereOrganization[0];

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
					message:
						"You are not authorized to perform this action on the resources associated to the provided arguments.",
				});
			}

			const [createdTag] = await ctx.drizzleClient
				.insert(tagsTable)
				.values({
					creatorId: currentUserId,
					isFolder: parsedArgs.input.isFolder,
					parentTagId: parsedArgs.input.parentTagId,
					name: parsedArgs.input.name,
					organizationId: parsedArgs.input.organizationId,
				})
				.returning();

			// Inserted tag not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
			if (createdTag === undefined) {
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

			return createdTag;
		},
		type: Tag,
	}),
);
