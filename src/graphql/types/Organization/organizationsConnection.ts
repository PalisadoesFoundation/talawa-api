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

// Define the connection arguments type
interface ConnectionArgs {
	first?: number | null;
	after?: string | null;
	last?: number | null;
	before?: string | null;
}

builder.queryField("organizationsConnection", (t) =>
	t.field({
		type: [Organization],
		args: {
			first: t.arg.int({ required: false }),
			after: t.arg.string({ required: false }),
			last: t.arg.int({ required: false }),
			before: t.arg.string({ required: false }),
		},
		resolve,
	}),
);

export const resolve = async (
	_parent: unknown,
	args: ConnectionArgs,
	ctx: GraphQLContext,
) => {
	try {
		// Create a Zod refinement context with proper type
		const refinementCtx: z.RefinementCtx = {
			path: [],
			addIssue: (issue: z.CustomErrorParams) => {
				console.error("Validation issue:", issue);
			},
		};

		// Convert empty strings to undefined
		const transformedArgs = transformDefaultGraphQLConnectionArguments(
			{
				first: args.first ?? undefined,
				after: args.after === "" ? undefined : (args.after ?? undefined),
				last: args.last ?? undefined,
				before: args.before === "" ? undefined : (args.before ?? undefined),
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
			createCursor: (org: { id: string }) => org.id,
			createNode: (org) => org,
		});

		return result.edges.map((edge) => edge.node);
	} catch (error) {
		// Check if error is already a TalawaGraphQLError
		if (error instanceof TalawaGraphQLError) {
			throw error; // Re-throw TalawaGraphQLError directly
		}

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
};
