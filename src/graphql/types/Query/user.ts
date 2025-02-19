import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import {
	QueryUserInput,
	queryUserInputSchema,
} from "~/src/graphql/inputs/QueryUserInput";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Schema for validating user query arguments
const queryUserArgumentsSchema = z.object({
	input: queryUserInputSchema,
});

// Query to fetch a single user
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
			// Validate input arguments
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
	input: queryUserInputSchema.optional(),
});

builder.queryField("users", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Optional filters for querying users.",
				required: false,
				type: QueryUserInput,
			}),
			first: t.arg({
				description: "Number of users to return",
				required: false,
				type: "Int",
			}),
			after: t.arg({
				description: "Cursor for pagination",
				required: false,
				type: "String",
			}),
		},
		description: "Query field to read all users with optional filtering.",
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

			const users = parsedArgs.input
				? await ctx.drizzleClient.query.usersTable.findMany({
						where: (fields, operators) =>
							operators.eq(fields.id, parsedArgs.input?.id ?? ""),
					})
				: await ctx.drizzleClient.query.usersTable.findMany();

			return users;
		},
		type: [User],
	}),
);
