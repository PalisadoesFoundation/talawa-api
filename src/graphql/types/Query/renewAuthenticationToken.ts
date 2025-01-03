import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

builder.queryField("renewAuthenticationToken", (t) =>
	t.string({
		description:
			"Query field to renew the authentication token of an authenticated client for signing in to talawa.",
		resolve: async (_parent, _args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const currentClientUserId = ctx.currentClient.user.id;
			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.id, currentClientUserId),
			});

			// Current user not existing in the database means that either it was deleted or its `id` column was changed by an external entity which correspondingly means that the current client is using an invalid authentication token which hasn't expired yet.
			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			return ctx.jwt.sign({
				user: {
					id: currentUser.id,
				},
			});
		},
	}),
);
