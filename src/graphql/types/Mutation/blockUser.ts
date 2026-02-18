import { z } from "zod";
import { blockedUsersTable } from "~/src/drizzle/tables/blockedUsers";
import { builder } from "~/src/graphql/builder";
import { notificationEventBus } from "~/src/graphql/types/Notification/EventBus/eventBus";
import { assertOrganizationAdmin } from "~/src/utilities/authorization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationBlockUserArgumentsSchema = z.object({
	organizationId: z.string().min(1, "Organization ID is required."),
	userId: z.string().min(1, "User ID is required."),
});

builder.mutationField("blockUser", (t) =>
	t.field({
		args: {
			organizationId: t.arg.id({ required: true }),
			userId: t.arg.id({ required: true }),
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

			const [currentUser, existingOrganization] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.organizationsTable.findFirst({
					columns: {
						name: true,
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
						operators.eq(fields.id, parsedArgs.organizationId),
				}),
			]);

			if (!existingOrganization) {
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

			const currentUserOrganizationMembership =
				existingOrganization.membershipsWhereOrganization[0];

			assertOrganizationAdmin(
				currentUser,
				currentUserOrganizationMembership,
				"You must be an admin of this organization to block users.",
			);

			const [targetUser, targetUserMembership, existingBlock] =
				await Promise.all([
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							id: true,
							role: true,
							name: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, parsedArgs.userId),
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

				// Notify the blocked user
				notificationEventBus.emitUserBlocked(
					{
						userId: parsedArgs.userId,
						userName: targetUser.name,
						organizationId: parsedArgs.organizationId,
						organizationName: existingOrganization.name,
					},
					ctx,
				);

				return true;
			});
		},
		type: "Boolean",
	}),
);
