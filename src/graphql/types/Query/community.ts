import { builder } from "~/src/graphql/builder";
import { Community } from "~/src/graphql/types/Community/Community";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

builder.queryField("community", (t) =>
	t.field({
		description: "Query field to read the community.",
		resolve: async (_parent, _args, ctx) => {
			const community =
				await ctx.drizzleClient.query.communitiesTable.findFirst({});

			// Community not existing is a business logic error and means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
			if (community === undefined) {
				ctx.log.error(
					"Postgres select operation returned an empty array for the community.",
				);

				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return community;
		},
		type: Community,
	}),
);
