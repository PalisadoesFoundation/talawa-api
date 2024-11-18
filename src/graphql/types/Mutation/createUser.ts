import { hash } from "@node-rs/argon2";
import { z } from "zod";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateUserInput,
	mutationCreateUserInputSchema,
} from "~/src/graphql/inputs/MutationCreateUserInput";
import { AuthenticationPayload } from "~/src/graphql/types/AuthenticationPayload";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationCreateUserArgumentsSchema = z.object({
	input: mutationCreateUserInputSchema,
});

builder.mutationField("createUser", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input required to create a user.",
				required: true,
				type: MutationCreateUserInput,
			}),
		},
		description: "Mutation field to create a user.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
					message: "Only authenticated users can perform this action.",
				});
			}

			const {
				data: parsedArgs,
				error,
				success,
			} = mutationCreateUserArgumentsSchema.safeParse(args);

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

			const currentUserId = ctx.currentClient.user.id;

			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: {
					role: true,
				},
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
					message: "Only authenticated users can perform this action.",
				});
			}

			if (currentUser.role !== "administrator") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
					message: "You are not authorized to perform this action.",
				});
			}

			const existingUserWithEmailAddress =
				await ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) =>
						operators.eq(fields.emailAddress, parsedArgs.input.emailAddress),
				});

			if (existingUserWithEmailAddress !== undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "emailAddress"],
								message: "This email address is already registered.",
							},
						],
					},
					message:
						"This action is forbidden on the resources associated to the provided arguments.",
				});
			}

			const [createdUser] = await ctx.drizzleClient
				.insert(usersTable)
				.values({
					...parsedArgs.input,
					creatorId: currentUserId,
					passwordHash: await hash(parsedArgs.input.password),
				})
				.returning();

			// Inserted user not being returned is a external defect unrelated to this code. It is very unlikely for this error to occur.
			if (createdUser === undefined) {
				ctx.log.error(
					"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "Something went wrong. Please try again.",
				});
			}

			return {
				authenticationToken: ctx.jwt.sign({
					user: {
						id: createdUser.id,
					},
				}),
				user: createdUser,
			};
		},
		type: AuthenticationPayload,
	}),
);
