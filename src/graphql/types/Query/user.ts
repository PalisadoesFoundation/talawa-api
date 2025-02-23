import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import {
	QueryUserInput,
	queryUserInputSchema,
} from "~/src/graphql/inputs/QueryUserInput";
import {
	QueryUsersInput,
	queryUsersInputSchema,
} from "~/src/graphql/inputs/QueryUsersInput";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryUserArgumentsSchema = z.object({
	input: queryUserInputSchema,
});

builder.queryField("user", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input to query a single user.",
				required: true,
				type: QueryUserInput,
			}),
		},
		description: "Query field to read a single user.",
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
				});
			}

			const user = await ctx.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.id, parsedArgs.input.id),
			});

			if (!user) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "id"] }],
					},
				});
			}

			return user;
		},
		type: User,
	}),
);

const queryUsersArgumentsSchema = z.object({
	input: queryUsersInputSchema.optional(),
});

builder.queryField("users", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Optional filters for querying users.",
				required: false,
				type: QueryUsersInput,
			}),
		},
		description: "Query field to read multiple users with an optional limit.",
		resolve: async (_parent, args, ctx) => {
			const {
				data: parsedArgs,
				error,
				success,
			} = queryUsersArgumentsSchema.safeParse(args);

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

			const limit = Math.min(parsedArgs.input?.limit ?? 100, 500);

			const users = await ctx.drizzleClient.query.usersTable.findMany({
				limit,
			});

			return users;
		},
		type: [User],
	}),
);
