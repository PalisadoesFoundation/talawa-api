import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import {
	QueryUserInput,
	queryUserInputSchema,
} from "~/src/graphql/inputs/QueryUserInput";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const queryUserArgumentsSchema = z.object({
	input: queryUserInputSchema,
});

builder.queryField("user", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input required to read a user.",
				type: QueryUserInput,
			}),
		},
		description: "Query field to read a user.",
		resolve: async (_parent, args, ctx) => {
			const {
				data: parsedArgs,
				error,
				success,
			} = queryUserArgumentsSchema.safeParse(args);

			if (!success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: error.issues.map((issue) => ({
							argumentPath: issue.path,
							message: issue.message,
						})),
					},
					message: "Invalid arguments provided.",
				});
			}

			const user = await ctx.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.id, parsedArgs.input.id),
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
					message: "No associated resources found for the provided arguments.",
				});
			}

			return user;
		},
		type: User,
	}),
);
