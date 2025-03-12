import { z } from "zod";
import { blockedUsersTable } from "~/src/drizzle/tables/blockedUsers";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationBlockUserArgumentsSchema = z.object({
	organizationId: z.string().min(1, "Organization ID is required."),
	userId: z.string().min(1, "User ID is required."),
});

builder.mutationField("blockUser", (t) =>
	t.field({
		args: {
			organizationId: t.arg.string({ required: true }),
			userId: t.arg.string({ required: true }),
		},
		description: "Mutation field to block a user from an organization.",
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
			} = mutationBlockUserArgumentsSchema.safeParse(args);

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

			const [
				organization,
				targetUser,
				currentUserMembership,
				targetUserMembership,
				existingBlock,
			] = await Promise.all([
				ctx.drizzleClient.query.organizationsTable.findFirst({
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.organizationId),
				}),
				ctx.drizzleClient.query.usersTable.findFirst({
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.userId),
				}),
				ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.memberId, currentUserId),
							operators.eq(fields.organizationId, parsedArgs.organizationId),
						),
				}),
				ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.memberId, parsedArgs.userId),
							operators.eq(fields.organizationId, parsedArgs.organizationId),
						),
				}),
				ctx.drizzleClient.query.blockedUsersTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.userId, parsedArgs.userId),
							operators.eq(fields.organizationId, parsedArgs.organizationId),
						),
				}),
			]);

			if (!organization) {
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

			if (!targetUser) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "userId"],
							},
						],
					},
				});
			}

			if (
				!currentUserMembership ||
				currentUserMembership.role !== "administrator"
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
						message:
							"You must be an admin of this organization to block users.",
					},
				});
			}

			if (existingBlock) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
						message: "User is already blocked from this organization.",
					},
				});
			}

			if (!targetUserMembership) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
						message: "User is not a member of the organization.",
					},
				});
			}

			if (parsedArgs.userId === currentUserId) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
						message: "You cannot block yourself.",
					},
				});
			}

			if (targetUser.role === "administrator") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
						message: "You cannot block an admin.",
					},
				});
			}

			return await ctx.drizzleClient.transaction(async (tx) => {
				await tx.insert(blockedUsersTable).values({
					organizationId: parsedArgs.organizationId,
					userId: parsedArgs.userId,

					createdAt: new Date(),
				});

				return true;
			});
		},
		type: "Boolean",
	}),
);
