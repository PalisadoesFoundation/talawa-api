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

builder.queryField("organization", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: QueryOrganizationInput,
			}),
		},
		description: "Query field to read an organization.",
		resolve: async (_parent, args, ctx) => {
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

			const organization =
				await ctx.drizzleClient.query.organizationsTable.findFirst({
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.id),
				});

			if (organization === undefined) {
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

			return organization;
		},
		type: Organization,
	}),
);
