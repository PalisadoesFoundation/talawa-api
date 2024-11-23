import { eq } from "drizzle-orm";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

builder.mutationField("deleteCurrentUser", (t) =>
	t.field({
		description: "Mutation field to delete the current user.",
		resolve: async (_parent, _args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
					message: "Only authenticated users can perform this action.",
				});
			}

			const [deletedCurrentUser] = await ctx.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, ctx.currentClient.user.id))
				.returning();

			// Deleted user not being returned means that either it was deleted or its `id` column was changed by an external entity before this update operation which correspondingly means that the current client is using an invalid authentication token which hasn't expired yet.
			if (deletedCurrentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
					message: "Only authenticated users can perform this action.",
				});
			}

			return deletedCurrentUser;
		},
		type: User,
	}),
);
