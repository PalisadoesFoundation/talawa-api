import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import {
	QueryOrganizationInput,
	queryOrganizationInputSchema,
} from "~/src/graphql/inputs/QueryOrganizationInput";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryOrganizationArgumentsSchema = z.object({
	input: queryOrganizationInputSchema,
});

builder.queryField("organizations", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Filter organizations by ID or order",
				required: false, // <-- Make input optional
				type: QueryOrganizationInput,
			}),
		},
		description: "Query field to read organizations.",
		resolve: async (_parent, args, ctx) => {
			// If input is provided, validate it
			if (args.input) {
				const {
					data: parsedArgs,
					error,
					success,
				} = queryOrganizationArgumentsSchema.safeParse(args);

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

				// If an ID is provided, fetch that specific organization
				if (parsedArgs.input.id) {
					const organization =
						await ctx.drizzleClient.query.organizationsTable.findFirst({
							where: (fields, operators) =>
								operators.eq(fields.id, parsedArgs.input.id),
						});

					if (!organization) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "arguments_associated_resources_not_found",
								issues: [{ argumentPath: ["input", "id"] }],
							},
						});
					}

					return organization;
				}
			}

			// If no input is provided, fetch all organizations (limit 100)
			return await ctx.drizzleClient.query.organizationsTable.findMany({
				limit: 100,
			});
		},
		type: [Organization],
	}),
);
