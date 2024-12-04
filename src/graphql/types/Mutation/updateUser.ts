import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateUserInput,
	mutationUpdateUserInputSchema,
} from "~/src/graphql/inputs/MutationUpdateUserInput";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationUpdateUserArgumentsSchema = z.object({
	input: mutationUpdateUserInputSchema,
});

builder.mutationField("updateUser", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input required to update a user.",
				required: true,
				type: MutationUpdateUserInput,
			}),
		},
		description: "Mutation field to update a user.",
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
				success,
				data: parsedArgs,
				error,
			} = mutationUpdateUserArgumentsSchema.safeParse(args);

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

			if (parsedArgs.input.id === currentUserId) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "id"],
								message:
									"You cannot update the user record associated to you with this action.",
							},
						],
					},
					message:
						"This action is forbidden on the resources associated to the provided arguments.",
				});
			}

			const { id, ...input } = parsedArgs.input;

			const [updatedUser] = await ctx.drizzleClient
				.update(usersTable)
				.set({
					...input,
					passwordHash:
						input.password !== undefined
							? await hash(input.password)
							: undefined,
					updaterId: currentUserId,
				})
				.where(eq(usersTable.id, id))
				.returning();

			// Updated user not being returned means that either the user does not exist or it was deleted or its `id` column was changed by an external entity before this upate operation.
			if (updatedUser === undefined) {
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

			return updatedUser;
		},
		type: User,
	}),
);
