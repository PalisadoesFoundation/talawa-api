import { eq } from "drizzle-orm";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

builder.mutationField("deleteCurrentUser", (t) =>
	t.field({
		description: "Mutation field to delete the current user.",
		resolve: async (_parent, _args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const currentUserId = ctx.currentClient.user.id;

			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: {
					avatarName: true,
				},
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			return await ctx.drizzleClient.transaction(async (tx) => {
				const [deletedCurrentUser] = await tx
					.delete(usersTable)
					.where(eq(usersTable.id, currentUserId))
					.returning();

				// Deleted user not being returned means that either it was deleted or its `id` column was changed by an external entity before this update operation which correspondingly means that the current client is using an invalid authentication token which hasn't expired yet.
				if (deletedCurrentUser === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				if (currentUser.avatarName !== null) {
					await ctx.minio.client.removeObject(
						ctx.minio.bucketName,
						currentUser.avatarName,
					);
				}

				return deletedCurrentUser;
			});
		},
		type: User,
	}),
);
