import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import {
	QueryUserInput,
	queryUserInputSchema,
} from "~/src/graphql/inputs/QueryUserInput";
import { User } from "~/src/graphql/types/User/User";
import { executeWithMetrics } from "~/src/graphql/utils/withQueryMetrics";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { withValidation } from "~/src/utilities/validation";

const queryUserArgumentsSchema = z.object({
	input: queryUserInputSchema,
});

builder.queryField("user", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: QueryUserInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Query field to read a user.",
		// Using withValidation utility for cleaner validation handling
		resolve: withValidation(
			{
				schema: queryUserArgumentsSchema,
			},
			async (_parent, args, ctx) => {
				const resolver = async () => {
					// Validation is handled by withValidation wrapper
					// args are already validated and type-safe
					const user = await ctx.drizzleClient.query.usersTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, args.input.id),
					});

					if (user === undefined) {
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

					return user;
				};

				return await executeWithMetrics(ctx, "query:user", resolver);
			},
		),
		type: User,
	}),
);
