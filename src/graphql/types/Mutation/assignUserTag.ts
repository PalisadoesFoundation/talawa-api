import { z } from "zod";
import { tagAssignmentsTable } from "~/src/drizzle/tables/tagAssignments";
import { builder } from "~/src/graphql/builder";
import { assertOrganizationAdmin } from "~/src/utilities/authorization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationAssignUserTagSchema = z.object({
	assigneeId: z.string().min(1, "User ID is required."),
	tagId: z.string().min(1, "Tag ID is required."),
});

builder.mutationField("assignUserTag", (t) =>
	t.field({
		args: {
			assigneeId: t.arg.id({ required: true }),
			tagId: t.arg.id({ required: true }),
		},
		description: "Assign a tag to a user within an organization.",
		resolve: async (_parent, args, ctx) => {
			// Check authentication
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const {
				data: parsedArgs,
				error,
				success,
			} = mutationAssignUserTagSchema.safeParse(args);

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

			// Get tag and organization info
			const existingTag = await ctx.drizzleClient.query.tagsTable.findFirst({
				columns: {
					organizationId: true,
				},
				where: (fields, operators) => operators.eq(fields.id, parsedArgs.tagId),
			});

			if (!existingTag) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["tagId"],
							},
						],
					},
				});
			}

			// Check admin permissions
			const [currentUser, organizationMembership] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.memberId, currentUserId),
							operators.eq(fields.organizationId, existingTag.organizationId),
						),
				}),
			]);

			assertOrganizationAdmin(
				currentUser,
				organizationMembership,
				"You must be an admin to assign tags.",
			);

			// Validate assignment
			const [targetUser, existingAssignment] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.assigneeId),
				}),
				ctx.drizzleClient.query.tagAssignmentsTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.assigneeId, parsedArgs.assigneeId),
							operators.eq(fields.tagId, parsedArgs.tagId),
						),
				}),
			]);

			if (!targetUser) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["assigneeId"],
							},
						],
					},
				});
			}

			if (existingAssignment) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["assigneeId", "tagId"],
								message: "This tag is already assigned to the user",
							},
						],
					},
				});
			}

			// Create tag assignment
			return await ctx.drizzleClient.transaction(async (tx) => {
				await tx.insert(tagAssignmentsTable).values({
					tagId: parsedArgs.tagId,
					assigneeId: parsedArgs.assigneeId,
					creatorId: currentUserId,
					createdAt: new Date(),
				});

				return true;
			});
		},
		type: "Boolean",
	}),
);
