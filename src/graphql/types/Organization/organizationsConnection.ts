import type { z } from "zod";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/defaultGraphQLConnection";
import type { GraphQLContext } from "../../context";
import { Organization } from "./Organization";

builder.queryField("organizationsConnection", (t) =>
	t.field({
		type: [Organization],
		args: {
			first: t.arg.int(),
			after: t.arg.string(),
			last: t.arg.int(),
			before: t.arg.string(),
		},
		resolve: async (
			_parent: unknown,
			args: {
				first?: number | null;
				after?: string | null;
				last?: number | null;
				before?: string | null;
			},
			ctx: GraphQLContext,
		) => {
			try {
				// Create a Zod refinement context
				const refinementCtx: z.RefinementCtx = {
					path: [],
					addIssue: (issue) => {
						console.error("Validation issue:", issue);
					},
				};

				const transformedArgs = transformDefaultGraphQLConnectionArguments(
					{
						first: args.first ?? undefined,
						after: args.after ?? undefined,
						last: args.last ?? undefined,
						before: args.before ?? undefined,
					},
					refinementCtx,
				);

				const organizations = await ctx.drizzleClient
					.select()
					.from(organizationsTable)
					.limit(transformedArgs.limit)
					.orderBy(organizationsTable.createdAt);

				if (!organizations || organizations.length === 0) {
					throw new TalawaGraphQLError({
						message: "No organizations found in the database.",
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["organizations"],
								},
							],
						},
					});
				}

				const result = transformToDefaultGraphQLConnection({
					parsedArgs: transformedArgs,
					rawNodes: organizations,
					createCursor: (org) => org.id,
					createNode: (org) => org,
				});

				return result.edges.map((edge) => edge.node);
			} catch (error) {
				throw new TalawaGraphQLError({
					message: "An unexpected error occurred while fetching organizations.",
					extensions: {
						code: "unexpected",
						issues: [
							{
								argumentPath: ["organizations"],
							},
						],
					},
				});
			}
		},
	}),
);
