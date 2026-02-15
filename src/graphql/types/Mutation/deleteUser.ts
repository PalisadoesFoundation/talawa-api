import { eq } from "drizzle-orm";
import { z } from "zod";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteUserInput,
	mutationDeleteUserInputSchema,
} from "~/src/graphql/inputs/MutationDeleteUserInput";
import { User } from "~/src/graphql/types/User/User";
import { zParseOrThrow } from "~/src/graphql/validators/helpers";
import {
	invalidateEntity,
	invalidateEntityLists,
} from "~/src/services/caching/invalidation";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationDeleteUserArgumentsSchema = z.object({
	input: mutationDeleteUserInputSchema,
});

builder.mutationField("deleteUser", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationDeleteUserInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to delete a user.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const parsedArgs = await zParseOrThrow(
				mutationDeleteUserArgumentsSchema,
				args,
			);

			const currentUserId = ctx.currentClient.user.id;

			const [currentUser, existingUser] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						avatarName: true,
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

			if (currentUser.role !== "administrator") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
				});
			}

			if (existingUser === undefined) {
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

			if (parsedArgs.input.id === ctx.currentClient.user.id) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "id"],
								message:
									"You cannot delete the user associated to you with this action.",
							},
						],
					},
				});
			}

			const result = await ctx.drizzleClient.transaction(async (tx) => {
				const [deletedUser] = await tx
					.delete(usersTable)
					.where(eq(usersTable.id, parsedArgs.input.id))
					.returning();

				// Deleted user not being returned means that either it was deleted or its `id` column was changed by an external entity before this operation.
				if (deletedUser === undefined) {
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

				if (existingUser.avatarName !== null)
					await ctx.minio.client.removeObject(
						ctx.minio.bucketName,
						existingUser.avatarName,
					);

				return deletedUser;
			});

			const results = await Promise.allSettled([
				invalidateEntity(ctx.cache, "user", parsedArgs.input.id),
				invalidateEntityLists(ctx.cache, "user"),
			]);

			for (let i = 0; i < results.length; i++) {
				const result = results[i];
				if (result !== undefined && result.status === "rejected") {
					ctx.log.error(
						{ cacheError: result.reason, entity: "user", opIndex: i },
						"Cache invalidation failed",
					);
				}
			}

			return result;
		},
		type: User,
	}),
);
