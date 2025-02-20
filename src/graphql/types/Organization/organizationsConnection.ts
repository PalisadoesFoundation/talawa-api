import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import { Organization } from "./Organization";

builder.queryField("organizationsConnection", (t) =>
	t.field({
		type: [Organization],
		resolve: async (_parent, args, ctx) => {
			const transformedArgs = transformDefaultGraphQLConnectionArguments(
				args,
				ctx,
			);

			try {
				const organizations = await ctx.drizzleClient
					.select()
					.from(organizationsTable)
					.limit(transformedArgs.limit)
					.orderBy(organizationsTable.createdAt);

				if (!organizations || organizations.length === 0) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "not_found",
							issues: [{ message: "No organizations found in the database." }],
						},
					});
				}

				return transformToDefaultGraphQLConnection({
					parsedArgs: transformedArgs,
					rawNodes: organizations,
					createCursor: (org) => org.id,
					createNode: (org) => org,
				});
			} catch (error) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
						issues: [
							{
								message:
									"An unexpected error occurred while fetching organizations.",
								details:
									error instanceof Error ? error.message : "Unknown error",
							},
						],
					},
				});
			}
		},
	}),
);
