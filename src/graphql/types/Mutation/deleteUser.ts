import { eq } from "drizzle-orm";
import { z } from "zod";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { MutationDeleteUserInput } from "~/src/graphql/inputs/MutationDeleteUserInput";
import { mutationDeleteUserInputSchema } from "~/src/graphql/inputs/MutationDeleteUserInput";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationDeleteUserArgumentsSchema = z.object({
	input: mutationDeleteUserInputSchema,
});

builder.mutationField("deleteUser", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input required to delete a user.",
				required: true,
				type: MutationDeleteUserInput,
			}),
		},
		description: "Mutation field to delete a user.",
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
			} = mutationDeleteUserArgumentsSchema.safeParse(args);

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

			if (parsedArgs.input.id === ctx.currentClient.user.id) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "id"],
								message:
									"You cannot delete the user associated to you with this action.",
							},
						],
					},
					message:
						"This action is forbidden on the resources associated to the provided arguments.",
				});
			}

			const [deletedUser] = await ctx.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, parsedArgs.input.id))
				.returning();

			// Deleted user not being returned means that either it was deleted or its `id` column was changed by an external entity before this operation.
			if (deletedUser === undefined) {
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

			return deletedUser;
		},
		type: User,
	}),
);
